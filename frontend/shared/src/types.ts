// API レスポンス型（backend/routes/api.php と対応）

export type Temperature = 'hot' | 'ice';

export interface ProductDTO {
  id: number;
  name: string;
  sub: string | null;
  price: number;
  icon: string | null;
  image: string | null; // 画像URL（設定があれば優先表示）
  stamp: string | null;
  sold: boolean;
  has_temperature: boolean;
}

export interface CategoryDTO {
  id: string; // slug: drink / leaf / sweet / set
  label: string;
  sub: string | null;
  items: ProductDTO[];
}

export interface HealthDTO {
  ok: boolean;
  app: string;
  time: string;
}

export type Role = 'staff' | 'owner';

export interface StaffDTO {
  id: number;
  name: string;
  initial: string | null;
  role: Role;
}

export interface PinLoginResponse {
  token: string;
  staff: StaffDTO;
}

// ---- 会計確定 ----
export interface SettingsDTO {
  cash_presets: number[]; // お預かりクイック金額
}

export type Gender = 'female' | 'male' | 'other';
export type AgeBand = '10s' | '20s' | '30s' | '40s' | '50s' | '60plus';
export type DineType = 'dine_in' | 'takeout';

export interface OrderPayload {
  dine_type: DineType;
  payment_method?: 'cash';
  received: number;
  items: { product_id: number; qty: number; temperature?: Temperature | null }[];
  customer?: { gender: Gender | null; age_band: AgeBand | null } | null;
}

export interface OrderResultItem {
  name: string;
  price: number;
  qty: number;
  line_total: number;
}

export interface OrderResultDTO {
  id: number;
  order_no: string;
  dine_type: DineType;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  received: number;
  change: number;
  completed_at: string | null;
  items: OrderResultItem[];
}

// ---- 管理（オーナー） ----
export interface CategoryLiteDTO {
  id: number;
  slug: string;
  label: string;
  sub: string | null;
}

export interface AdminProductDTO {
  id: number;
  category_id: number;
  category: { id: number; slug: string; label: string } | null;
  name: string;
  sub: string | null;
  price: number;
  tax_rate: number;
  icon: string | null;
  image: string | null;
  stamp: string | null;
  is_sold_out: boolean;
  is_visible: boolean;
  has_temperature: boolean;
  sort_order: number;
}

export interface ProductInput {
  category_id: number;
  name: string;
  sub: string | null;
  price: number;
  tax_rate?: number;
  icon: string | null;
  stamp: string | null;
  is_sold_out?: boolean;
  is_visible?: boolean;
  has_temperature?: boolean;
}

export interface TodaySummaryDTO {
  date: string;
  total_sales: number;
  order_count: number;
  item_count: number;
  avg_price: number;
  dine_in: number;
  takeout: number;
  hours: { hour: number; total: number }[];
}

// ---- PC分析 ----
export type Period = 'day' | 'month' | 'year';

export interface KpiItem {
  label: string;
  value: number;
  money: boolean;
  unit: string | null;
  delta: number | null; // 前期比 %
}

export interface CategorySlice {
  label: string;
  value: number;
  pct: number;
  color: string;
}

export interface ProductRank {
  name: string;
  qty: number;
  amt: number;
  pct: number;
}

export interface TrendRow {
  label: string;
  sales: number;
  count: number;
  avg: number;
}

export interface SalesAnalyticsDTO {
  period: Period;
  year: number;
  month: number;
  available_years: number[];
  total: number;
  rows: TrendRow[];
  hours: { labels: string[]; data: number[]; peak: number };
  categories: CategorySlice[];
  products: ProductRank[];
}

export interface DistSlice {
  label: string;
  value: number;
  pct: number;
}

export interface CustomerAnalyticsDTO {
  sample_size: number;
  avg_age: number | null;
  top_segment: string;
  gender: DistSlice[];
  age: DistSlice[];
}

// ---- 経費管理 ----
export type ExpenseType = 'cost' | 'expense'; // 原価 / 経費

export interface ExpenseCategoryDTO {
  id: number;
  name: string;
  type: ExpenseType;
  sort_order: number;
  is_active: boolean;
}

export interface ExpenseCategoryInput {
  name: string;
  type: ExpenseType;
  sort_order?: number;
  is_active?: boolean;
}

export interface ExpenseDTO {
  id: number;
  year: number;
  month: number;
  expense_category_id: number | null;
  category: string; // 名目名のスナップショット
  amount: number;
  note: string | null;
}

export interface ExpenseMonthDTO {
  entries: ExpenseDTO[];
  total: number;
}

export interface ExpenseInput {
  year: number;
  month: number;
  expense_category_id: number;
  amount: number;
  note: string | null;
}

// ---- 損益管理 ----
export interface ProfitRow {
  month: number;
  label: string;
  sales: number;
  cost: number; // 原価
  gross: number; // 粗利益 = 売上 − 原価
  expense: number; // 経費
  operating: number; // 営業利益 = 粗利益 − 経費
  gross_margin: number | null;
  operating_margin: number | null;
}

export interface ProfitDTO {
  year: number;
  available_years: number[];
  rows: ProfitRow[];
  total_sales: number;
  total_cost: number;
  total_gross: number;
  total_expense: number;
  total_operating: number;
  gross_margin: number | null;
  operating_margin: number | null;
}
