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
    /** 公開URL（無ければ null）。相対URLで返し、サブディレクトリ公開時は
     *  PUBLIC_BASE（例 "/toorisugari_tool"）を先頭に付与する。 */
    public function imageUrl(): ?string
    {
        if (! $this->image_path) {
            return null;
        }
        $base = rtrim((string) config('app.public_base'), '/');

        return $base.'/storage/'.$this->image_path;
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
