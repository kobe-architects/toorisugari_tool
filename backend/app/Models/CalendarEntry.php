<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** カレンダーの予定（PC管理コンソール／スマホ版カレンダー共用）。 */
#[Fillable(['date', 'title', 'status', 'start_time', 'end_time', 'memo'])]
class CalendarEntry extends Model
{
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
