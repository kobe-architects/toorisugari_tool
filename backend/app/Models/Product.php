<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'category_id', 'name', 'sub', 'price', 'tax_rate',
    'icon', 'image_path', 'stamp', 'is_sold_out', 'is_visible', 'has_temperature', 'sort_order',
])]
class Product extends Model
{
    /** 公開URL（無ければ null）。Vite proxy・スマホLAN・本番Apache のいずれでも
     *  同一オリジンで解決できるよう相対URL "/storage/..." を返す。 */
    public function imageUrl(): ?string
    {
        return $this->image_path ? '/storage/'.$this->image_path : null;
    }

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'tax_rate' => 'decimal:2',
            'is_sold_out' => 'boolean',
            'is_visible' => 'boolean',
            'has_temperature' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
