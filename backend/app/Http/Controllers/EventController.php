<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\MaterialConsumption;
use App\Models\OperatingDay;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * イベント管理（オーナー専用）。
 * イベント＝名前＋開催期間。期間内の会計・自動原価・出店料を日付で集計し、
 * イベント別の売上・損益を返す。
 */
class EventController extends Controller
{
    /** イベント一覧（各イベントの集計つき）＋全体サマリー。 */
    public function index()
    {
        $events = Event::orderByDesc('start_date')->orderByDesc('id')->get();
        $rows = $events->map(fn (Event $e) => array_merge($this->present($e), $this->stats($e)))->all();

        return [
            'events' => $rows,
            // 全体（全期間・全会計）と、登録イベント合算
            'overall_sales' => (int) Order::where('status', 'completed')->sum('total'),
            'event_sales' => (int) array_sum(array_column($rows, 'sales')),
            'event_profit' => (int) array_sum(array_column($rows, 'profit')),
        ];
    }

    public function store(Request $request)
    {
        $event = Event::create($this->validateData($request, true));

        return response()->json(array_merge($this->present($event), $this->stats($event)), 201);
    }

    public function update(Request $request, Event $event)
    {
        $event->update($this->validateData($request, false));
        $event = $event->fresh();

        return array_merge($this->present($event), $this->stats($event));
    }

    public function destroy(Event $event)
    {
        $event->delete(); // 集計は日付ベースのため、売上・経費データには影響しない

        return response()->noContent();
    }

    private function validateData(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'name' => [$required, 'string', 'max:120'],
            'start_date' => [$required, 'date'],
            'end_date' => [$required, 'date', 'after_or_equal:start_date'],
            'note' => ['nullable', 'string', 'max:200'],
        ]);
    }

    private function present(Event $e): array
    {
        return [
            'id' => $e->id,
            'name' => $e->name,
            'start_date' => $e->start_date->toDateString(),
            'end_date' => $e->end_date->toDateString(),
            'note' => $e->note,
        ];
    }

    /**
     * イベントに紐づく日付（開催期間 ＋ 開店時にこのイベントを選択した日）の集計。
     * 利益 = 売上 − 自動原価（茶葉・物販） − イベント出店料。
     * 月単位で手入力する経費はイベントに按分できないため含めない。
     */
    private function stats(Event $e): array
    {
        // 対象日 = 開催期間の全日 ∪ 開店時にこのイベントを選択した日（期間外の追加出店も拾う）
        $dates = collect();
        for ($d = $e->start_date->copy(); $d->lte($e->end_date); $d->addDay()) {
            $dates->push($d->toDateString());
        }
        $linked = OperatingDay::where('event_id', $e->id)->pluck('date')->map(fn ($d) => Carbon::parse($d)->toDateString());
        $dates = $dates->merge($linked)->unique()->values();

        $orders = Order::where('status', 'completed')
            ->whereIn(\Illuminate\Support\Facades\DB::raw('DATE(completed_at)'), $dates->all())
            ->get(['id', 'total']);
        $sales = (int) $orders->sum('total');
        $count = $orders->count();

        $costAuto = (int) round((float) MaterialConsumption::whereIn('consumed_on', $dates->all())->sum('amount'));
        $fee = (int) OperatingDay::whereIn('date', $dates->all())->sum('event_fee');
        $days = OperatingDay::whereIn('date', $dates->all())->count(); // 開店登録した営業日数

        $profit = $sales - $costAuto - $fee;

        return [
            'days' => $days,
            'sales' => $sales,
            'order_count' => $count,
            'avg_price' => $count ? intdiv($sales, $count) : 0,
            'cost_auto' => $costAuto,
            'event_fee' => $fee,
            'profit' => $profit,
            'margin' => $sales ? round($profit / $sales * 100, 1) : null,
        ];
    }
}
