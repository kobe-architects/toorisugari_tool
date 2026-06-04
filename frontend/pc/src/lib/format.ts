import type { KpiItem } from '@shared/types';

export const yen = (v: number): string => v.toLocaleString('ja-JP');

/** KPI値を表示文字列に整形（金額は¥、それ以外は数値+単位）。 */
export function fmtKpi(k: KpiItem): string {
  if (k.money) return `¥${yen(k.value)}`;
  return `${yen(k.value)}${k.unit ?? ''}`;
}
