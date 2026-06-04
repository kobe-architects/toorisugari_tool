import type {
  AdminProductDTO,
  CategoryDTO,
  CategoryLiteDTO,
  CustomerAnalyticsDTO,
  ExpenseCategoryDTO,
  ExpenseCategoryInput,
  ExpenseDTO,
  ExpenseInput,
  ExpenseMonthDTO,
  HealthDTO,
  OrderPayload,
  OrderResultDTO,
  Period,
  PinLoginResponse,
  ProductInput,
  ProfitDTO,
  SalesAnalyticsDTO,
  StaffDTO,
  TodaySummaryDTO,
} from './types';

// API のベースURLを SPA の公開ベース(import.meta.env.BASE_URL)から自動導出する。
//  - 開発:      base '/pos/'  → '/api'（Vite proxyが :8000 へ転送）
//  - 本番ルート: base '/pos/'  → '/api'
//  - サブディレクトリ: base '/toorisugari_tool/pos/' → '/toorisugari_tool/api'
// これにより、ビルド時の --base 指定だけでサブディレクトリ公開に追従できる。
function defaultApiBase(): string {
  const b = import.meta.env.BASE_URL || '/'; // 例 '/pos/' | '/toorisugari_tool/pc/'
  const prefix = b.replace(/(pos|pc)\/*$/i, '').replace(/\/+$/, ''); // 末尾の pos/pc とスラッシュを除去
  return `${prefix}/api`;
}
const BASE = import.meta.env.VITE_API_BASE ?? defaultApiBase();

let authToken: string | null = null;

/** Sanctum トークンを設定（null で解除）。以降のリクエストに Bearer 付与。 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

export class ApiError extends Error {
  status: number;
  /** バリデーションエラー（422）のフィールド別メッセージ */
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && (data.message as string)) || `API ${res.status}`;
    throw new ApiError(res.status, message, data?.errors);
  }
  return data as T;
}

export const api = {
  health: () => request<HealthDTO>('GET', '/health'),
  products: () => request<CategoryDTO[]>('GET', '/products'),
  staff: () => request<StaffDTO[]>('GET', '/staff'),
  pinLogin: (staffId: number, pin: string) =>
    request<PinLoginResponse>('POST', '/auth/pin', { staff_id: staffId, pin }),
  login: (email: string, password: string) =>
    request<PinLoginResponse>('POST', '/auth/login', { email, password }),
  logout: () => request<void>('POST', '/auth/logout'),
  createOrder: (payload: OrderPayload) => request<OrderResultDTO>('POST', '/orders', payload),

  // ---- 管理（オーナー専用） ----
  admin: {
    summaryToday: () => request<TodaySummaryDTO>('GET', '/admin/summary/today'),
    categories: () => request<CategoryLiteDTO[]>('GET', '/admin/categories'),
    products: () => request<AdminProductDTO[]>('GET', '/admin/products'),
    createProduct: (input: ProductInput) => request<AdminProductDTO>('POST', '/admin/products', input),
    updateProduct: (id: number, patch: Partial<ProductInput>) =>
      request<AdminProductDTO>('PATCH', `/admin/products/${id}`, patch),
    deleteProduct: (id: number) => request<void>('DELETE', `/admin/products/${id}`),
    /** 商品画像アップロード（multipart）。 */
    uploadProductImage: async (id: number, file: File): Promise<AdminProductDTO> => {
      const fd = new FormData();
      fd.append('image', file);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${BASE}/admin/products/${id}/image`, { method: 'POST', headers, body: fd });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new ApiError(res.status, (data && data.message) || `API ${res.status}`, data?.errors);
      return data as AdminProductDTO;
    },
    deleteProductImage: (id: number) => request<AdminProductDTO>('DELETE', `/admin/products/${id}/image`),
  },

  // ---- PC分析（オーナー専用） ----
  analytics: {
    sales: (period: Period, opts?: { year?: number; month?: number }) => {
      const q = new URLSearchParams({ period });
      if (opts?.year) q.set('year', String(opts.year));
      if (opts?.month) q.set('month', String(opts.month));
      return request<SalesAnalyticsDTO>('GET', `/analytics/sales?${q.toString()}`);
    },
    customers: () => request<CustomerAnalyticsDTO>('GET', '/analytics/customers'),
    profit: (year: number) => request<ProfitDTO>('GET', `/analytics/profit?year=${year}`),
    /** CSVをBlobで取得（認証ヘッダ付き）。 */
    salesCsv: async (period: Period, opts?: { year?: number; month?: number }): Promise<Blob> => {
      const q = new URLSearchParams({ period });
      if (opts?.year) q.set('year', String(opts.year));
      if (opts?.month) q.set('month', String(opts.month));
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${BASE}/analytics/sales.csv?${q.toString()}`, { headers });
      if (!res.ok) throw new ApiError(res.status, `CSV ${res.status}`);
      return res.blob();
    },
  },

  // ---- 経費管理（オーナー専用） ----
  expenses: {
    list: (year: number, month: number) => request<ExpenseMonthDTO>('GET', `/expenses?year=${year}&month=${month}`),
    create: (input: ExpenseInput) => request<ExpenseDTO>('POST', '/expenses', input),
    update: (id: number, patch: Partial<ExpenseInput>) => request<ExpenseDTO>('PATCH', `/expenses/${id}`, patch),
    remove: (id: number) => request<void>('DELETE', `/expenses/${id}`),
  },

  // ---- 名目マスタ（原価・経費の名目／オーナー専用） ----
  expenseCategories: {
    list: () => request<ExpenseCategoryDTO[]>('GET', '/expense-categories'),
    create: (input: ExpenseCategoryInput) => request<ExpenseCategoryDTO>('POST', '/expense-categories', input),
    update: (id: number, patch: Partial<ExpenseCategoryInput>) => request<ExpenseCategoryDTO>('PATCH', `/expense-categories/${id}`, patch),
    remove: (id: number) => request<void>('DELETE', `/expense-categories/${id}`),
  },
};
