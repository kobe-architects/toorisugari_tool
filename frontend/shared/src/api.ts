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
  GeocodeCandidate,
  HealthDTO,
  LpConfigDTO,
  LpSection,
  EventDTO,
  EventInput,
  EventOptionDTO,
  EventSelection,
  EventsResponse,
  BreakEvenDTO,
  BudgetSaveResult,
  MaterialDTO,
  MaterialInput,
  MaterialPurchaseDTO,
  MaterialPurchaseInput,
  OperatingDayDTO,
  RegionDTO,
  RegionSource,
  ReverseGeocodeDTO,
  TodayOperatingDTO,
  OrderDetailDTO,
  OrderListParams,
  OrderListResponse,
  OrderPayload,
  OrderResultDTO,
  OrderUpdatePayload,
  Period,
  PinLoginResponse,
  ProductInput,
  ProfitDTO,
  SalesAnalyticsDTO,
  SettingsDTO,
  StaffDTO,
  SystemSettingsDTO,
  TodaySummaryDTO,
  WeatherDayDTO,
  WeatherMonthDTO,
  WeatherOverrideInput,
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
let onUnauthorized: (() => void) | null = null;

/** Sanctum トークンを設定（null で解除）。以降のリクエストに Bearer 付与。 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** 401 を受けたときに呼ばれるハンドラ（自動ログアウト等）。 */
export function setOnUnauthorized(fn: (() => void) | null): void {
  onUnauthorized = fn;
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
    if (res.status === 401) onUnauthorized?.();
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
  settings: () => request<SettingsDTO>('GET', '/settings'),
  lpConfig: () => request<LpConfigDTO>('GET', '/lp-config'),

  // ---- ジオコーディング（ログイン必須・POS/PC共用） ----
  geo: {
    /** 地域名の検索。 */
    search: (q: string) => request<{ results: GeocodeCandidate[] }>('GET', `/geo/search?q=${encodeURIComponent(q)}`),
    /** GPS座標 → 地域。 */
    reverse: (lat: number, lon: number) => request<ReverseGeocodeDTO>('GET', `/geo/reverse?lat=${lat}&lon=${lon}`),
  },

  // ---- 営業日の設定（POSレジ・ログイン必須） ----
  operatingDay: {
    /** 本日の営業地域・イベント・出店料とデフォルト地域を取得。 */
    today: () => request<TodayOperatingDTO>('GET', '/operating-day/today'),
    /** 開店画面のイベント選択肢（本日開催中を先頭に）。 */
    eventOptions: () => request<EventOptionDTO[]>('GET', '/operating-day/event-options'),
    /** 本日の営業地域・イベント・出店料を設定（出店料は経費に自動計上）。 */
    set: (region: RegionDTO, source: RegionSource, eventFee: number, event: EventSelection) =>
      request<OperatingDayDTO>('POST', '/operating-day', {
        region,
        source,
        event_fee: eventFee,
        event_id: event.event_id,
        new_event_name: event.new_event_name ?? null,
      }),
  },

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
    updateSettings: (input: { cash_presets: number[] }) => request<SettingsDTO>('PATCH', '/admin/settings', input),

    // ---- イベント管理 ----
    events: {
      list: () => request<EventsResponse>('GET', '/admin/events'),
      create: (input: EventInput) => request<EventDTO>('POST', '/admin/events', input),
      update: (id: number, patch: Partial<EventInput>) => request<EventDTO>('PATCH', `/admin/events/${id}`, patch),
      remove: (id: number) => request<void>('DELETE', `/admin/events/${id}`),
    },

    // ---- 茶葉（仕入・在庫） ----
    materials: {
      list: () => request<MaterialDTO[]>('GET', '/admin/materials'),
      create: (input: MaterialInput) => request<MaterialDTO>('POST', '/admin/materials', input),
      update: (id: number, patch: Partial<MaterialInput>) => request<MaterialDTO>('PATCH', `/admin/materials/${id}`, patch),
      remove: (id: number) => request<void>('DELETE', `/admin/materials/${id}`),
      /** 仕入履歴（新しい順）。 */
      purchases: (id: number) => request<MaterialPurchaseDTO[]>('GET', `/admin/materials/${id}/purchases`),
      /** 仕入登録。更新後の茶葉（残量・平均単価）も返る。 */
      addPurchase: (input: MaterialPurchaseInput) =>
        request<{ purchase: MaterialPurchaseDTO; material: MaterialDTO }>('POST', '/admin/material-purchases', input),
      /** 仕入の削除（誤登録の取り消し）。更新後の茶葉を返す。 */
      removePurchase: (purchaseId: number) => request<MaterialDTO>('DELETE', `/admin/material-purchases/${purchaseId}`),
    },

    // ---- システム設定（POSログイン時のデフォルト地域） ----
    systemSettings: () => request<SystemSettingsDTO>('GET', '/admin/system-settings'),
    updateSystemSettings: (input: SystemSettingsDTO) => request<SystemSettingsDTO>('PATCH', '/admin/system-settings', input),

    // ---- LP（公式サイト）設定 ----
    /** 1セクション分だけ更新（他セクションには影響しない）。 */
    updateLpSection: <K extends LpSection>(section: K, data: LpConfigDTO[K]) =>
      request<LpConfigDTO>('PATCH', '/admin/lp-config', { section, data }),
    /** LP用画像アップロード（multipart）。表示用の絶対URLを返す。 */
    uploadLpImage: async (file: File): Promise<{ url: string }> => {
      const fd = new FormData();
      fd.append('image', file);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${BASE}/admin/lp-config/image`, { method: 'POST', headers, body: fd });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new ApiError(res.status, (data && data.message) || `API ${res.status}`, data?.errors);
      return data as { url: string };
    },

    // ---- 伝票管理 ----
    orders: {
      list: (p: OrderListParams = {}) => {
        const q = new URLSearchParams();
        if (p.status) q.set('status', p.status);
        if (p.q) q.set('q', p.q);
        if (p.from) q.set('from', p.from);
        if (p.to) q.set('to', p.to);
        if (p.page) q.set('page', String(p.page));
        if (p.per_page) q.set('per_page', String(p.per_page));
        if (p.sort) q.set('sort', p.sort);
        if (p.dir) q.set('dir', p.dir);
        const qs = q.toString();
        return request<OrderListResponse>('GET', `/admin/orders${qs ? `?${qs}` : ''}`);
      },
      get: (id: number) => request<OrderDetailDTO>('GET', `/admin/orders/${id}`),
      update: (id: number, payload: OrderUpdatePayload) => request<OrderDetailDTO>('PATCH', `/admin/orders/${id}`, payload),
      void: (id: number) => request<OrderDetailDTO>('POST', `/admin/orders/${id}/void`),
    },
  },

  // ---- PC分析（オーナー専用） ----
  analytics: {
    sales: (period: Period, opts?: { year?: number; month?: number; category?: string }) => {
      const q = new URLSearchParams({ period });
      if (opts?.year) q.set('year', String(opts.year));
      if (opts?.month) q.set('month', String(opts.month));
      if (opts?.category) q.set('category', opts.category);
      return request<SalesAnalyticsDTO>('GET', `/analytics/sales?${q.toString()}`);
    },
    customers: () => request<CustomerAnalyticsDTO>('GET', '/analytics/customers'),
    profit: (year: number, category?: string) =>
      request<ProfitDTO>('GET', `/analytics/profit?year=${year}${category ? `&category=${encodeURIComponent(category)}` : ''}`),
    /** 損益分岐分析（月次）。 */
    breakEven: (year: number, month: number) => request<BreakEvenDTO>('GET', `/analytics/break-even?year=${year}&month=${month}`),
    /** 月次売上予算の登録・更新（0で削除）。 */
    saveBudget: (year: number, month: number, targetSales: number) =>
      request<BudgetSaveResult>('PUT', '/analytics/budget', { year, month, target_sales: targetSales }),
    /** 指定年月の日別天気（伝票のある日だけ）。 */
    weather: (year: number, month: number) => request<WeatherMonthDTO>('GET', `/analytics/weather?year=${year}&month=${month}`),
    /** 天気の手動登録・更新（1日分）。 */
    saveWeather: (input: WeatherOverrideInput) => request<WeatherDayDTO>('POST', '/analytics/weather', input),
    /** 天気の手動登録を削除（自動取得に戻す）。 */
    deleteWeather: (date: string) => request<void>('DELETE', `/analytics/weather/${date}`),
    /** CSVをBlobで取得（認証ヘッダ付き）。 */
    salesCsv: async (period: Period, opts?: { year?: number; month?: number; category?: string }): Promise<Blob> => {
      const q = new URLSearchParams({ period });
      if (opts?.year) q.set('year', String(opts.year));
      if (opts?.month) q.set('month', String(opts.month));
      if (opts?.category) q.set('category', opts.category);
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
