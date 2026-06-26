import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AgeBand, Gender, OptionSelection, OrderSource, ProductDTO, Temperature } from '@shared/types';
import { inclusiveTax } from '../lib/money';

const STORAGE_KEY = 'pos_cart';

export type DineType = 'dine_in' | 'takeout';

export interface CartLine {
  lineId: string; // product.id + temperature + 注文経路 + 客層 + 選択肢 の複合キー
  product: ProductDTO;
  temperature: Temperature | null;
  orderSource: OrderSource;
  gender: Gender | null;
  ageBand: AgeBand | null;
  selections: OptionSelection[];
  qty: number;
}

/** 商品＋温度＋注文経路＋客層＋選択肢から行を一意に識別するキー。 */
export function lineKey(productId: number, temperature: Temperature | null, orderSource: OrderSource, gender: Gender | null, ageBand: AgeBand | null, selections: OptionSelection[] = []): string {
  const sel = selections.map((s) => `${s.name}=${s.value}`).join('|');
  return `${productId}:${temperature ?? ''}:${orderSource}:${gender ?? ''}:${ageBand ?? ''}:${sel}`;
}

/** 温度サフィックス（ホット/アイス）付きの表示名。 */
export function lineName(line: CartLine): string {
  const suffix = line.temperature === 'hot' ? '（ホット）' : line.temperature === 'ice' ? '（アイス）' : '';
  return line.product.name + suffix;
}

interface CartState {
  lines: CartLine[];
  dineType: DineType;
  setDineType: (d: DineType) => void;
  add: (p: ProductDTO, temperature?: Temperature | null, selections?: OptionSelection[], orderSource?: OrderSource, gender?: Gender | null, ageBand?: AgeBand | null) => void;
  inc: (lineId: string) => void;
  dec: (lineId: string) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  tax: number;
  total: number;
}

const CartCtx = createContext<CartState | null>(null);

function loadStored(): { lines: CartLine[]; dineType: DineType } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], dineType: 'takeout' };
    const v = JSON.parse(raw);
    const lines: CartLine[] = (Array.isArray(v.lines) ? v.lines : []).map((l: CartLine) => ({ ...l, selections: l.selections ?? [], orderSource: l.orderSource ?? 'direct', gender: l.gender ?? null, ageBand: l.ageBand ?? null }));
    return { lines, dineType: v.dineType === 'dine_in' ? 'dine_in' : 'takeout' };
  } catch {
    return { lines: [], dineType: 'takeout' };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const stored = loadStored();
  const [lines, setLines] = useState<CartLine[]>(stored.lines);
  const [dineType, setDineType] = useState<DineType>(stored.dineType); // 既定は持ち帰り

  // 画面更新でカートが消えないよう localStorage に保持
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, dineType }));
  }, [lines, dineType]);

  const add = (p: ProductDTO, temperature: Temperature | null = null, selections: OptionSelection[] = [], orderSource: OrderSource = 'direct', gender: Gender | null = null, ageBand: AgeBand | null = null) =>
    setLines((prev) => {
      const id = lineKey(p.id, temperature, orderSource, gender, ageBand, selections);
      const hit = prev.find((l) => l.lineId === id);
      if (hit) return prev.map((l) => (l.lineId === id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { lineId: id, product: p, temperature, orderSource, gender, ageBand, selections, qty: 1 }];
    });

  const inc = (lineId: string) =>
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + 1 } : l)));

  const dec = (lineId: string) =>
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, qty: l.qty - 1 } : l)).filter((l) => l.qty > 0));

  const remove = (lineId: string) => setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  const clear = () => setLines([]);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const l of lines) {
      c += l.qty;
      s += l.product.price * l.qty;
    }
    return { count: c, subtotal: s };
  }, [lines]);

  const tax = inclusiveTax(subtotal);

  return (
    <CartCtx.Provider value={{ lines, dineType, setDineType, add, inc, dec, remove, clear, count, subtotal, tax, total: subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
