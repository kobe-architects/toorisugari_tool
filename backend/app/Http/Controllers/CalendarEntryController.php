<?php

namespace App\Http\Controllers;

use App\Models\CalendarEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * カレンダー（予定）。PC管理コンソールとスマホ版カレンダー(/cal/)で共用。
 * シンプルな予定登録のみ：日付・予定名・時刻（任意）・メモ（任意）。
 */
class CalendarEntryController extends Controller
{
    /** 月単位で一覧（?month=YYYY-MM。前後月にまたがる表示のため前後7日も含む）。 */
    public function index(Request $request)
    {
        $data = $request->validate([
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        $first = Carbon::createFromFormat('Y-m-d', $data['month'].'-01')->startOfDay();
        $from = $first->copy()->subDays(7)->toDateString();
        $to = $first->copy()->endOfMonth()->addDays(7)->toDateString();

        return CalendarEntry::whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->orderByRaw('start_time IS NULL, start_time') // 終日→時刻順
            ->orderBy('id')
            ->get()
            ->map(fn (CalendarEntry $e) => $this->present($e));
    }

    public function store(Request $request)
    {
        $entry = CalendarEntry::create($this->validateData($request, true));

        return response()->json($this->present($entry), 201);
    }

    public function update(Request $request, CalendarEntry $entry)
    {
        $entry->update($this->validateData($request, false));

        return $this->present($entry->fresh());
    }

    public function destroy(CalendarEntry $entry)
    {
        $entry->delete();

        return response()->noContent();
    }

    private function validateData(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'date' => [$required, 'date'],
            // ステータス付き（応募中/出店確定）は予定名を省略可。通常の予定は必須
            'title' => $creating
                ? ['nullable', 'required_without:status', 'string', 'max:120']
                : ['sometimes', 'nullable', 'string', 'max:120'],
            'status' => ['nullable', 'in:applying,confirmed'], // null=通常 / 出店応募中 / 出店確定
            'start_time' => ['nullable', 'regex:/^\d{2}:\d{2}$/'],
            'end_time' => ['nullable', 'regex:/^\d{2}:\d{2}$/'],
            'memo' => ['nullable', 'string', 'max:500'],
        ]);
    }

    private function present(CalendarEntry $e): array
    {
        return [
            'id' => $e->id,
            'date' => $e->date->toDateString(),
            'title' => $e->title,
            'status' => $e->status,
            'start_time' => $e->start_time,
            'end_time' => $e->end_time,
            'memo' => $e->memo,
        ];
    }
}
