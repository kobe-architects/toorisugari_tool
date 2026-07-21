<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** 茶葉マスタ。現在残量(stock_g)と移動平均g単価(avg_unit_price)を保持する。 */
#[Fillable(['name', 'stock_g', 'avg_unit_price', 'low_stock_g', 'sort_order'])]
class Material extends Model
{
    protected function casts(): array
    {
        return [
            'stock_g' => 'float',
            'avg_unit_price' => 'float',
            'low_stock_g' => 'float',
            'sort_order' => 'integer',
        ];
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(MaterialPurchase::class);
    }

    public function productMaterials(): HasMany
    {
        return $this->hasMany(ProductMaterial::class);
    }

    /**
     * 仕入・消費の履歴を時系列に再生して、現在残量と移動平均g単価を再計算する。
     * 仕入の追加・削除時に呼ぶ（過去の消費記録の金額スナップショットは変更しない）。
     * 同日のイベントは仕入→消費の順で処理する。
     */
    public function recalcLedger(): void
    {
        $events = [];
        foreach ($this->purchases()->get() as $p) {
            $events[] = [
                'd' => $p->purchased_on->toDateString(), 'pri' => 0, 'id' => $p->id,
                'in' => (float) $p->quantity_g,
                'up' => $p->quantity_g > 0 ? $p->total_price / (float) $p->quantity_g : 0.0,
            ];
        }
        foreach (MaterialConsumption::where('material_id', $this->id)->get() as $c) {
            $events[] = ['d' => $c->consumed_on->toDateString(), 'pri' => 1, 'id' => $c->id, 'out' => (float) $c->grams];
        }
        usort($events, fn ($a, $b) => [$a['d'], $a['pri'], $a['id']] <=> [$b['d'], $b['pri'], $b['id']]);

        $stock = 0.0;
        $avg = 0.0;
        foreach ($events as $e) {
            if (isset($e['in'])) {
                $base = max($stock, 0.0); // マイナス在庫は平均計算では0扱い
                $avg = ($base + $e['in']) > 0 ? ($base * $avg + $e['in'] * $e['up']) / ($base + $e['in']) : $avg;
                $stock += $e['in'];
            } else {
                $stock -= $e['out'];
            }
        }

        $this->update(['stock_g' => round($stock, 1), 'avg_unit_price' => round($avg, 2)]);
    }
}
