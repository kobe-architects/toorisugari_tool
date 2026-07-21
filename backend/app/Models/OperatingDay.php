<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** 営業日ごとの地域・イベント・出店料（POSレジの開店時に設定）。 */
#[Fillable(['date', 'region', 'source', 'set_by', 'event_id', 'event_fee', 'event_fee_expense_id'])]
class OperatingDay extends Model
{
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'region' => 'array',
            'event_fee' => 'integer',
        ];
    }

    public function event(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
