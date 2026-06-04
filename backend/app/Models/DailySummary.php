<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'business_date', 'total_sales', 'order_count', 'item_count',
    'avg_price', 'by_category', 'by_hour', 'computed_at',
])]
class DailySummary extends Model
{
    protected function casts(): array
    {
        return [
            'business_date' => 'date',
            'by_category' => 'array',
            'by_hour' => 'array',
            'computed_at' => 'datetime',
        ];
    }
}
