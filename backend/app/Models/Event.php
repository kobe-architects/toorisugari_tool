<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** 出店イベント。開催期間の日付で売上・原価・出店料を集計する。 */
#[Fillable(['name', 'start_date', 'end_date', 'note'])]
class Event extends Model
{
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }
}
