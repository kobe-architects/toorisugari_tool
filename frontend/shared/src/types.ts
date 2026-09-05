// API レスポンス型（backend/routes/api.php と対応）

export type Temperature = 'hot' | 'ice';
export type OrderSource = 'direct' | 'tasting'; // 直注文 / 試飲から

/** 商品の任意選択肢グループ（例: 産地＝宮崎/五ヶ瀬） */
export interface ProductOption {
  name: string;
  choices: string[];
}

/** 会計時の選択結果（例: 産地＝宮崎） */
export interface OptionSelection {
  name: string;
  value: string;
}

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
  has_order_source: boolean;
  show_on_lp: boolean;
  options: ProductOption[];
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

// ---- システム設定（地域・天気） ----
/** 登録済みの地域（Open-Meteo で解決した緯度経度つき）。 */
export interface RegionDTO {
  name: string;
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface SystemSettingsDTO {
  region: RegionDTO | null;
  fallback?: RegionDTO; // 未設定時のフォールバック地域（指宿市）
}

/** 地域検索（ジオコーディング）の候補。 */
export interface GeocodeCandidate {
  name: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

/** 営業地域の設定元。 */
export type RegionSource = 'gps' | 'default' | 'search' | 'manual';

/** リバースジオコーディング（GPS座標→地域）の結果。 */
export interface ReverseGeocodeDTO {
  result: RegionDTO;
}

/** POSレジ・本日の営業設定（未設定なら region=null / event_fee=null）。default はシステム設定のデフォルト地域。 */
export interface TodayOperatingDTO {
  date: string; // YYYY-MM-DD
  region: RegionDTO | null;
  source: RegionSource | null;
  event: { id: number; name: string } | null; // 開店時に選択したイベント（null=イベントなし）
  event_fee: number | null; // イベント出店料(円)。null=未登録（開店時に必須入力）
  default: RegionDTO | null;
}

/** 開店画面のイベント選択肢。 */
export interface EventOptionDTO {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  covers_today: boolean; // 本日が開催期間内
}

/** 開店時のイベント指定。id指定（null=イベントなし）か、新規名で本日1日のイベントを作成。 */
export interface EventSelection {
  event_id: number | null;
  new_event_name?: string;
}

/** 営業設定の保存結果。 */
export interface OperatingDayDTO {
  date: string;
  region: RegionDTO;
  source: RegionSource | null;
  event: { id: number; name: string } | null;
  event_fee: number;
}

/** 天気アイコンの種別（frontend の WeatherIcon と対応）。 */
export type WeatherIconKind = 'sunny' | 'partly' | 'cloudy' | 'rain' | 'snow' | 'thunder';

/** 1日分の天気。 */
export interface WeatherDayDTO {
  date: string; // YYYY-MM-DD
  day: number; // 日（1-31）
  code: number | null; // WMO weather code（手動登録は null）
  icon: WeatherIconKind;
  label: string; // 日本語の天気名
  tmax: number | null;
  tmin: number | null;
  region: string | null; // その日に使った地域（営業地域 or デフォルト）
  source: 'auto' | 'manual'; // 自動取得 / 手動登録
}

/** 天気の手動登録の入力。 */
export interface WeatherOverrideInput {
  date: string; // YYYY-MM-DD
  icon: WeatherIconKind;
  tmax: number | null;
  tmin: number | null;
}

/** 指定年月の日別天気（未設定なら configured=false）。 */
export interface WeatherMonthDTO {
  configured: boolean;
  region: string | null;
  days: WeatherDayDTO[];
}

// ---- LP（公式サイト）設定 ----
export interface LpCommon {
  logo: string | null; // ロゴ画像URL（null=LP同梱画像）
}
export interface LpHero {
  slides: string[]; // PC用スライド画像URL（空=LP同梱の既定画像）
  slides_sp: string[]; // スマホ用スライド画像URL（空=LP同梱のSP既定画像）
  interval_sec: number; // スライド切替の秒数
  title: string; // キャッチ（改行可）
  subtitle: string; // 副題
}
export interface LpConcept {
  text: string;
}
export interface LpAbout {
  image: string | null; // 画像URL（null=LP同梱画像）
  heading: string;
  text: string; // 段落は空行で区切り
}
export interface LpFooter {
  text: string; // 改行可
}
export interface LpConfigDTO {
  common: LpCommon;
  hero: LpHero;
  concept: LpConcept;
  about: LpAbout;
  footer: LpFooter;
}
export type LpSection = keyof LpConfigDTO;

export type Gender = 'female' | 'male' | 'other';
export type AgeBand = '10s' | '20s' | '30s' | '40s' | '50s' | '60plus';
export type DineType = 'dine_in' | 'takeout';

/** 会計明細の送信形（客層は商品ごとにタップ入力するため明細単位で保持） */
export interface OrderItemPayload {
  product_id: number;
  qty: number;
  temperature?: Temperature | null;
  order_source?: OrderSource;
  gender?: Gender | null;
  age_band?: AgeBand | null;
  options?: OptionSelection[];
}

export interface OrderPayload {
  dine_type: DineType;
  payment_method?: 'cash';
  received: number;
  items: OrderItemPayload[];
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

// ---- 伝票管理（オーナー） ----
export type OrderStatus = 'completed' | 'voided';

/** 伝票一覧の1行（軽量） */
export interface OrderListItemDTO {
  id: number;
  order_no: string;
  status: OrderStatus;
  dine_type: DineType;
  total: number;
  item_count: number;
  staff: string | null;
  completed_at: string | null;
}

/** 伝票一覧（ページネーション） */
export interface OrderListResponse {
  data: OrderListItemDTO[];
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/** 伝票明細（編集フォーム復元用） */
export interface OrderDetailItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  qty: number;
  line_total: number;
  temperature: Temperature | null;
  order_source: OrderSource;
  gender: Gender | null;
  age_band: AgeBand | null;
  options: OptionSelection[];
}

/** 伝票詳細 */
export interface OrderDetailDTO {
  id: number;
  order_no: string;
  status: OrderStatus;
  dine_type: DineType;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  received: number;
  change: number;
  completed_at: string | null;
  staff: string | null;
  items: OrderDetailItem[];
}

/** 伝票編集の送信ペイロード（store と同形） */
export interface OrderUpdatePayload {
  dine_type: DineType;
  payment_method?: 'cash';
  received: number;
  items: OrderItemPayload[];
}

/** 伝票一覧のソート可能な列 */
export type OrderSortKey = 'order_no' | 'completed_at' | 'dine_type' | 'item_count' | 'total' | 'status';

/** 伝票一覧の絞り込み条件 */
export interface OrderListParams {
  status?: OrderStatus;
  q?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  per_page?: number;
  sort?: OrderSortKey;
  dir?: 'asc' | 'desc';
}

// ---- カレンダー（予定） ----
/** カレンダーの予定（PC管理コンソール／スマホ版カレンダー共用）。 */
export interface CalendarEntryDTO {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  start_time: string | null; // 'HH:MM'（終日はnull）
  end_time: string | null; // 'HH:MM'
  memo: string | null;
}

export interface CalendarEntryInput {
  date: string;
  title: string;
  start_time?: string | null;
  end_time?: string | null;
  memo?: string | null;
}

// ---- イベント管理 ----
/** 出店イベント（期間内の売上・自動原価・出店料を日付で集計）。 */
export interface EventDTO {
  id: number;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  note: string | null;
  days: number; // 開店登録した営業日数
  sales: number;
  order_count: number;
  avg_price: number;
  cost_auto: number; // 自動原価（茶葉・物販）
  event_fee: number; // イベント出店料合計
  profit: number; // 売上 − 自動原価 − 出店料
  margin: number | null; // 利益率(%)
}

export interface EventInput {
  name: string;
  start_date: string;
  end_date: string;
  note?: string | null;
}

export interface EventsResponse {
  events: EventDTO[];
  overall_sales: number; // 全体売上（全期間・全会計）
  event_sales: number; // 登録イベントの売上合計
  event_profit: number; // 登録イベントの利益合計
}

// ---- 仕入・在庫（茶葉） ----
/** 茶葉マスタ。残量と移動平均g単価はサーバ側で管理。 */
export interface MaterialDTO {
  id: number;
  name: string;
  stock_g: number; // 現在残量(g)。マイナスは登録漏れの可能性
  avg_unit_price: number; // 移動平均g単価(円/g)
  low_stock_g: number | null; // 残量警告の閾値(g)
  products: { id: number; name: string; grams: number }[]; // この茶葉を使う商品
}

export interface MaterialInput {
  name: string;
  low_stock_g?: number | null;
}

export interface MaterialPurchaseDTO {
  id: number;
  material_id: number;
  purchased_on: string; // YYYY-MM-DD
  quantity_g: number;
  total_price: number; // 円
  unit_price: number; // 円/g（この仕入単体）
  note: string | null;
}

export interface MaterialPurchaseInput {
  material_id: number;
  purchased_on: string;
  quantity_g: number;
  total_price: number;
  note?: string | null;
}

/** 商品に登録する使用茶葉（1杯あたりg） */
export interface ProductMaterialInput {
  material_id: number;
  grams: number;
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
  cost_price: number | null; // 原価(円/個)。物販カテゴリのみ
  tax_rate: number;
  icon: string | null;
  image: string | null;
  stamp: string | null;
  is_sold_out: boolean;
  is_visible: boolean;
  has_temperature: boolean;
  has_order_source: boolean;
  show_on_lp: boolean;
  options: ProductOption[];
  materials: { material_id: number; name: string; grams: number }[]; // 使用茶葉
  sort_order: number;
}

export interface ProductInput {
  category_id: number;
  name: string;
  sub: string | null;
  price: number;
  cost_price?: number | null; // 物販カテゴリのみ有効
  tax_rate?: number;
  icon: string | null;
  stamp: string | null;
  is_sold_out?: boolean;
  is_visible?: boolean;
  has_temperature?: boolean;
  has_order_source?: boolean;
  show_on_lp?: boolean;
  options?: ProductOption[];
  materials?: ProductMaterialInput[]; // キーを送らなければ紐付けは変更されない
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
  pct: number; // カテゴリ内構成比
}

/** カテゴリごとの商品別ランキング */
export interface ProductRankGroup {
  key: string; // カテゴリslug（商品未紐付けは other）
  label: string;
  total: number; // カテゴリ小計
  rows: ProductRank[];
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
  category: string | null; // 絞り込み中のカテゴリslug（null=全体）
  available_years: number[];
  total: number;
  rows: TrendRow[];
  hours: { labels: string[]; data: number[]; peak: number };
  categories: CategorySlice[];
  products: ProductRankGroup[];
  by_source: { key: OrderSource; label: string; amount: number; qty: number }[];
}

export interface DistSlice {
  label: string;
  value: number;
  pct: number;
}

/** 商品別の客層内訳（提供数=qty 重み付け） */
export interface ProductSegmentDTO {
  name: string;
  sample_size: number;
  avg_age: number | null;
  top_segment: string;
  gender: DistSlice[];
  age: DistSlice[];
}

export interface CustomerAnalyticsDTO {
  sample_size: number;
  avg_age: number | null;
  top_segment: string;
  gender: DistSlice[];
  age: DistSlice[];
  by_product: ProductSegmentDTO[];
}

// ---- 損益分岐分析 ----
/** 商品別の「あと何杯」情報。 */
export interface BreakEvenProductRow {
  id: number;
  name: string;
  category: string;
  price: number;
  unit_var_cost: number; // 1杯あたり変動費（茶葉g×平均g単価＋物販原価）
  unit_cm: number; // 1杯あたり貢献利益 = 価格 − 変動費
  sold_qty: number; // 当月の販売数
  cups_to_break_even: number | null; // 分岐点まであと何杯（0=達成済 / null=算出不可）
  cups_to_target: number | null; // 予算まであと何杯（予算未登録ならnull）
}

/** 月次の損益分岐分析。変動費=原価（自動＋手入力）／固定費=経費（出店料含む）。 */
export interface BreakEvenDTO {
  year: number;
  month: number;
  available_years: number[];
  sales: number;
  var_cost: number;
  var_cost_auto: number;
  var_cost_manual: number;
  fixed_cost: number;
  contribution: number; // 貢献利益 = 売上 − 変動費
  cm_ratio: number | null; // 貢献利益率(%)
  break_even_sales: number | null; // 損益分岐点売上高
  break_even_achievement: number | null; // 達成率(%)
  uncovered: number; // 固定費の未回収額（<=0で黒字）
  operating: number; // 営業利益
  target_sales: number | null; // 売上予算
  target_achievement: number | null; // 予算達成率(%)
  products: BreakEvenProductRow[];
}

export interface BudgetSaveResult {
  year: number;
  month: number;
  target_sales: number | null;
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
  cost: number; // 原価 = 自動（茶葉）＋ 手入力
  cost_auto: number; // 茶葉の自動計上分
  cost_manual: number; // 経費画面から手入力した原価
  gross: number; // 粗利益 = 売上 − 原価
  expense: number; // 経費
  operating: number; // 営業利益 = 粗利益 − 経費
  gross_margin: number | null;
  operating_margin: number | null;
}

export interface ProfitDTO {
  year: number;
  category: string | null; // 絞り込み中のカテゴリslug（null=全体）。カテゴリ別は経費・手入力原価を含まない
  available_years: number[];
  rows: ProfitRow[];
  total_sales: number;
  total_cost: number;
  total_cost_auto: number;
  total_cost_manual: number;
  total_gross: number;
  total_expense: number;
  total_operating: number;
  gross_margin: number | null;
  operating_margin: number | null;
}
