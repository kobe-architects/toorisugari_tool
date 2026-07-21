<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** 茶葉の仕入履歴。登録時点では原価に計上せず、販売時の消費で自動計上する。 */
#[Fillable(['material_id', 'purchased_on', 'quantity_g', 'total_price', 'note'])]
class MaterialPurchase extends Model
{
    protected function casts(): array
    {
        return [
            'purchased_on' => 'date',
            'quantity_g' => 'float',
            'total_price' => 'integer',
        ];
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
