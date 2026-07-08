<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** 営業日ごとの地域（POSレジのログイン時に設定）。 */
#[Fillable(['date', 'region', 'source', 'set_by'])]
class OperatingDay extends Model
{
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'region' => 'array',
        ];
    }
}
