<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** 月次の売上予算（損益分岐分析の目標値）。 */
#[Fillable(['year', 'month', 'target_sales'])]
class Budget extends Model
{
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'target_sales' => 'integer',
        ];
    }
}
