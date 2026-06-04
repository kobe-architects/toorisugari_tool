// 金額計算ユーティリティ（すべて税込・円の整数で扱う）

export const DEFAULT_TAX_RATE = 0.1;

/** 税込価格から内税額を求める（四捨五入）。 */
export function inclusiveTax(totalInclusive: number, rate = DEFAULT_TAX_RATE): number {
  return totalInclusive - Math.round(totalInclusive / (1 + rate));
}

/** 円表記（カンマ区切り）。 */
export function yen(v: number): string {
  return v.toLocaleString('ja-JP');
}
