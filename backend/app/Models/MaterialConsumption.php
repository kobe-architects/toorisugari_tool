<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 販売時の茶葉消費記録（自動原価）。
 * 販売時点の移動平均g単価をスナップショットとして保持するため、
 * 後から仕入単価が変わっても過去の原価はブレない。
 */
#[Fillable(['order_item_id', 'material_id', 'material_name', 'grams', 'unit_price', 'amount', 'consumed_on'])]
class MaterialConsumption extends Model
{
    protected function casts(): array
    {
        return [
            'grams' => 'float',
            'unit_price' => 'float',
            'amount' => 'float',
            'consumed_on' => 'date',
        ];
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
