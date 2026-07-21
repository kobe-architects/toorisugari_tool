<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** 商品⇔茶葉の紐付け（1杯あたり使用g）。飲み比べ等は複数行を持つ。 */
#[Fillable(['product_id', 'material_id', 'grams'])]
class ProductMaterial extends Model
{
    protected function casts(): array
    {
        return ['grams' => 'float'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
