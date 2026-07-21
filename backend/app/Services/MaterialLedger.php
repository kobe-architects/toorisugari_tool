<?php

namespace App\Services;

use App\Models\Material;
use App\Models\MaterialConsumption;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductMaterial;

/**
 * 販売⇔原価の連動。
 * 会計確定で、使用茶葉は在庫を消費（移動平均g単価で自動原価を計上）、
 * 物販は商品に登録した原価（円/個）を自動計上する。
 * 取消・編集時は計上記録を戻して在庫を復元する。
 */
class MaterialLedger
{
    /** 伝票の明細に紐づく茶葉消費・物販原価を計上する（伝票は completed であること）。 */
    public static function apply(Order $order): void
    {
        $order->loadMissing('items');
        $productIds = $order->items->pluck('product_id')->filter()->unique()->all();
        if (! $productIds) {
            return;
        }
        $links = ProductMaterial::with('material')
            ->whereIn('product_id', $productIds)
            ->get()
            ->groupBy('product_id');
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
        $date = $order->completed_at?->toDateString() ?? now()->toDateString();

        foreach ($order->items as $item) {
            // 使用茶葉（ドリンク・飲み比べ）
            foreach ($links->get($item->product_id, collect()) as $link) {
                $m = $link->material;
                if (! $m) {
                    continue;
                }
                $grams = round((float) $link->grams * $item->qty, 1);
                MaterialConsumption::create([
                    'order_item_id' => $item->id,
                    'material_id' => $m->id,
                    'material_name' => $m->name,
                    'grams' => $grams,
                    'unit_price' => $m->avg_unit_price,
                    'amount' => round($grams * (float) $m->avg_unit_price, 2),
                    'consumed_on' => $date,
                ]);
                Material::where('id', $m->id)->decrement('stock_g', $grams);
            }

            // 物販の原価（商品に登録した円/個 × 数量）
            $p = $products->get($item->product_id);
            if ($p && $p->cost_price !== null && $p->cost_price > 0) {
                MaterialConsumption::create([
                    'order_item_id' => $item->id,
                    'material_id' => null,
                    'material_name' => $p->name.'（物販原価）',
                    'grams' => 0,
                    'unit_price' => $p->cost_price,
                    'amount' => $p->cost_price * $item->qty,
                    'consumed_on' => $date,
                ]);
            }
        }
    }

    /** 伝票の消費記録を取り消し、在庫を復元する（冪等）。 */
    public static function reverse(Order $order): void
    {
        $itemIds = $order->items()->pluck('id');
        $consumptions = MaterialConsumption::whereIn('order_item_id', $itemIds)->get();
        foreach ($consumptions as $c) {
            if ($c->material_id) {
                Material::where('id', $c->material_id)->increment('stock_g', (float) $c->grams);
            }
            $c->delete();
        }
    }
}
