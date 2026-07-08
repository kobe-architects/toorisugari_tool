<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** 天気の手動登録（自動取得より優先）。 */
#[Fillable(['date', 'icon', 'tmax', 'tmin'])]
class WeatherOverride extends Model
{
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'tmax' => 'float',
            'tmin' => 'float',
        ];
    }
}
