<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\OperatingDay;
use App\Support\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * 営業日の設定（POSレジの開店時に登録）。ログイン中のスタッフが操作する。
 * - 営業地域（未設定日の既定はシステム設定のデフォルト地域）
 * - イベント（必須選択。登録済み／新規名で作成／イベントなし）
 * - イベント出店料（必須登録。0円可。経費「イベント出店料」として自動計上）
 */
class OperatingDayController extends Controller
{
    /** 本日の地域・イベント・出店料と、デフォルト地域（システム設定）を返す。 */
    public function today()
    {
        $today = Carbon::now('Asia/Tokyo')->toDateString();
        $record = OperatingDay::with('event:id,name')->whereDate('date', $today)->first();

        return [
            'date' => $today,
            'region' => $record?->region,
            'source' => $record?->source,
            'event' => $record?->event ? ['id' => $record->event->id, 'name' => $record->event->name] : null,
            'event_fee' => $record?->event_fee, // null=未登録（開店フローで必須入力）
            'default' => Region::effectiveDefault(),
        ];
    }

    /** 開店画面のイベント選択肢（本日が期間内のものを先頭に、直近30件）。 */
    public function eventOptions()
    {
        $today = Carbon::now('Asia/Tokyo')->toDateString();

        return Event::orderByDesc('start_date')->orderByDesc('id')->limit(30)->get()
            ->map(fn (Event $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'start_date' => $e->start_date->toDateString(),
                'end_date' => $e->end_date->toDateString(),
                'covers_today' => $e->start_date->toDateString() <= $today && $today <= $e->end_date->toDateString(),
            ])
            ->sortByDesc('covers_today')
            ->values()
            ->all();
    }

    /**
     * 本日の地域・イベント・出店料を設定（同日の再登録は上書き）。
     * イベントは event_id（null=イベントなし）か new_event_name（本日1日のイベントを新規作成）で指定。
     * 出店料は経費に自動計上する。
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'region' => ['required', 'array'],
            'region.name' => ['required', 'string', 'max:120'],
            'region.label' => ['nullable', 'string', 'max:200'],
            'region.latitude' => ['required', 'numeric', 'between:-90,90'],
            'region.longitude' => ['required', 'numeric', 'between:-180,180'],
            'region.timezone' => ['nullable', 'string', 'max:64'],
            'source' => ['nullable', 'string', 'in:gps,default,search,manual'],
            'event_id' => ['present', 'nullable', 'integer', 'exists:events,id'], // 必須送信（null=イベントなし）
            'new_event_name' => ['nullable', 'string', 'max:120'],
            'event_fee' => ['required', 'integer', 'min:0'],
        ]);

        $r = $data['region'];
        $region = [
            'name' => $r['name'],
            'label' => $r['label'] ?? $r['name'],
            'latitude' => round((float) $r['latitude'], 4),
            'longitude' => round((float) $r['longitude'], 4),
            'timezone' => $r['timezone'] ?: 'Asia/Tokyo',
        ];

        $today = Carbon::now('Asia/Tokyo')->toDateString();

        // 新規イベント名が指定されたら本日1日のイベントを作成して選択（PCで後から期間を編集可能）
        $eventId = $data['event_id'];
        if (! empty($data['new_event_name'])) {
            $eventId = Event::create([
                'name' => trim($data['new_event_name']),
                'start_date' => $today,
                'end_date' => $today,
            ])->id;
        }

        $record = OperatingDay::updateOrCreate(
            ['date' => $today],
            ['region' => $region, 'source' => $data['source'] ?? 'manual', 'set_by' => $request->user()?->id, 'event_id' => $eventId, 'event_fee' => $data['event_fee']],
        );

        $this->syncEventFeeExpense($record);
        $record->load('event:id,name');

        return [
            'date' => $today,
            'region' => $record->region,
            'source' => $record->source,
            'event' => $record->event ? ['id' => $record->event->id, 'name' => $record->event->name] : null,
            'event_fee' => $record->event_fee,
        ];
    }

    /**
     * 出店料を経費「イベント出店料」に計上する。
     * 同日の再登録は既存の経費行を上書き。0円なら経費行を削除する。
     */
    private function syncEventFeeExpense(OperatingDay $record): void
    {
        $fee = (int) $record->event_fee;
        $existing = $record->event_fee_expense_id ? Expense::find($record->event_fee_expense_id) : null;

        if ($fee <= 0) {
            if ($existing) {
                $existing->delete();
                $record->update(['event_fee_expense_id' => null]);
            }
            return;
        }

        $date = Carbon::parse($record->date);
        $note = $date->format('n/j').' '.(($record->region['label'] ?? $record->region['name'] ?? '') ?: '出店');

        if ($existing) {
            $existing->update(['amount' => $fee, 'note' => $note]);
            return;
        }

        $cat = ExpenseCategory::firstOrCreate(
            ['name' => 'イベント出店料', 'type' => 'expense'],
            ['sort_order' => (int) ExpenseCategory::max('sort_order') + 1, 'is_active' => true],
        );
        $expense = Expense::create([
            'year' => $date->year,
            'month' => $date->month,
            'expense_category_id' => $cat->id,
            'category' => $cat->name,
            'type' => 'expense',
            'amount' => $fee,
            'note' => $note,
        ]);
        $record->update(['event_fee_expense_id' => $expense->id]);
    }
}
