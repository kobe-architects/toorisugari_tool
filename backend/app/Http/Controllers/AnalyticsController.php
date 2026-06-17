<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    /**
     * 売上管理ビュー：選択期間の売上推移（行）＋時間帯・カテゴリ・商品ランキング。
     * - day  : year+month を選び、その月の日別一覧
     * - month: year を選び、その年の月別一覧
     * - year : 直近5年
     */
    public function sales(Request $request)
    {
        [$period, $year, $month] = $this->resolveSelection($request);
        [$buckets, $start, $end] = $this->buckets($period, $year, $month);

        $orders = $this->ordersIn($start, $end);

        $rows = array_map(function ($b) use ($orders) {
            $inBucket = $orders->filter(fn (Order $o) => $o->completed_at->betweenIncluded($b['start'], $b['end']));
            $sales = (int) $inBucket->sum('total');
            $count = $inBucket->count();
            return [
                'label' => $b['label'],
                'sales' => $sales,
                'count' => $count,
                'avg' => $count ? intdiv($sales, $count) : 0,
            ];
        }, $buckets);

        $total = (int) $orders->sum('total');

        // 時間帯（選択期間, 10-21時）
        $hours = [];
        for ($h = 10; $h <= 21; $h++) {
            $hours[] = (int) $orders->filter(fn (Order $o) => optional($o->completed_at)->hour === $h)->sum('total');
        }
        $peak = $hours ? array_keys($hours, max($hours))[0] : 0;

        $items = OrderItem::with('product.category')->whereIn('order_id', $orders->pluck('id'))->get();

        // 注文経路別（直注文 / 試飲から）
        $bySource = collect(['direct' => '直注文', 'tasting' => '試飲から'])
            ->map(function ($label, $key) use ($items) {
                $g = $items->where('order_source', $key);
                return ['key' => $key, 'label' => $label, 'amount' => (int) $g->sum('line_total'), 'qty' => (int) $g->sum('qty')];
            })->values()->all();

        return [
            'period' => $period,
            'year' => $year,
            'month' => $month,
            'available_years' => $this->availableYears(),
            'total' => $total,
            'rows' => $rows,
            'hours' => [
                'labels' => array_map('strval', range(10, 21)),
                'data' => $hours,
                'peak' => $peak,
            ],
            'categories' => $this->categoryComposition($items, $total),
            'products' => $this->productRanking($items, $total),
            'by_source' => $bySource,
        ];
    }

    /** 損益管理：指定年の月別 売上・費用・営業利益。 */
    public function profit(Request $request)
    {
        $year = (int) ($request->query('year') ?: now()->year);

        $start = Carbon::create($year, 1, 1)->startOfDay();
        $end = Carbon::create($year, 12, 31)->endOfDay();
        $orders = $this->ordersIn($start, $end);
        $expenses = \App\Models\Expense::where('year', $year)->get(['month', 'type', 'amount']);

        $rows = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthExp = $expenses->where('month', $m);
            $sales = (int) $orders->filter(fn (Order $o) => optional($o->completed_at)->month === $m)->sum('total');
            $cost = (int) $monthExp->where('type', 'cost')->sum('amount');     // 原価
            $expense = (int) $monthExp->where('type', 'expense')->sum('amount'); // 経費
            $gross = $sales - $cost;                 // 粗利益
            $operating = $gross - $expense;          // 営業利益

            $rows[] = [
                'month' => $m,
                'label' => "{$m}月",
                'sales' => $sales,
                'cost' => $cost,
                'gross' => $gross,
                'expense' => $expense,
                'operating' => $operating,
                'gross_margin' => $sales ? round($gross / $sales * 100, 1) : null,
                'operating_margin' => $sales ? round($operating / $sales * 100, 1) : null,
            ];
        }

        $sum = fn (string $k) => (int) array_sum(array_column($rows, $k));
        $totalSales = $sum('sales');
        $totalGross = $sum('gross');
        $totalOperating = $sum('operating');

        return [
            'year' => $year,
            'available_years' => $this->availableYears(),
            'rows' => $rows,
            'total_sales' => $totalSales,
            'total_cost' => $sum('cost'),
            'total_gross' => $totalGross,
            'total_expense' => $sum('expense'),
            'total_operating' => $totalOperating,
            'gross_margin' => $totalSales ? round($totalGross / $totalSales * 100, 1) : null,
            'operating_margin' => $totalSales ? round($totalOperating / $totalSales * 100, 1) : null,
        ];
    }

    /** 顧客分析ビュー：性別・年代・サマリー。 */
    public function customers()
    {
        $orders = Order::where('status', 'completed')
            ->whereHas('customerAttribute')
            ->with('customerAttribute')
            ->get();

        $attrs = $orders->pluck('customerAttribute');
        $withGender = $attrs->filter(fn ($a) => $a && $a->gender);
        $withAge = $attrs->filter(fn ($a) => $a && $a->age_band);

        $genderLabels = ['female' => '女性', 'male' => '男性', 'other' => 'その他'];
        $gender = collect($genderLabels)->map(function ($label, $key) use ($withGender) {
            $n = $withGender->where('gender', $key)->count();
            return ['label' => $label, 'value' => $n, 'pct' => $withGender->count() ? round($n / $withGender->count() * 100) : 0];
        })->values();

        $ageOrder = ['10s' => '10代', '20s' => '20代', '30s' => '30代', '40s' => '40代', '50s' => '50代', '60plus' => '60代〜'];
        $age = collect($ageOrder)->map(function ($label, $key) use ($withAge) {
            $n = $withAge->where('age_band', $key)->count();
            return ['label' => $label, 'value' => $n, 'pct' => $withAge->count() ? round($n / $withAge->count() * 100) : 0];
        })->values();

        $ageMid = ['10s' => 15, '20s' => 25, '30s' => 35, '40s' => 45, '50s' => 55, '60plus' => 65];
        $avgAge = $withAge->count()
            ? round($withAge->sum(fn ($a) => $ageMid[$a->age_band]) / $withAge->count(), 1)
            : null;

        $topGender = $gender->sortByDesc('value')->first();
        $topAge = $age->sortByDesc('value')->first();

        return [
            'sample_size' => $attrs->count(),
            'avg_age' => $avgAge,
            'top_segment' => $topGender && $topAge && $topGender['value'] > 0 ? "{$topAge['label']}{$topGender['label']}" : '—',
            'gender' => $gender,
            'age' => $age,
        ];
    }

    /** 選択期間の売上推移CSV出力。 */
    public function salesCsv(Request $request): StreamedResponse
    {
        [$period, $year, $month] = $this->resolveSelection($request);
        [$buckets, $start, $end] = $this->buckets($period, $year, $month);
        $orders = $this->ordersIn($start, $end);

        $rows = array_map(function ($b) use ($orders) {
            $inBucket = $orders->filter(fn (Order $o) => $o->completed_at->betweenIncluded($b['start'], $b['end']));
            $sales = (int) $inBucket->sum('total');
            $count = $inBucket->count();
            return [$b['label'], $sales, $count, $count ? intdiv($sales, $count) : 0];
        }, $buckets);

        $name = "sales_{$period}_{$year}".($period === 'day' ? "-{$month}" : '').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['期間', '売上(円)', '会計件数', '客単価(円)']);
            foreach ($rows as $r) {
                fputcsv($out, $r);
            }
            fclose($out);
        }, $name, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    // ---- helpers ----

    /** period・year・month を確定（未指定は当年・当月）。 */
    private function resolveSelection(Request $request): array
    {
        $period = in_array($request->query('period'), ['day', 'month', 'year'], true) ? $request->query('period') : 'month';
        $year = (int) ($request->query('year') ?: now()->year);
        $month = (int) ($request->query('month') ?: now()->month);
        $month = max(1, min(12, $month));

        return [$period, $year, $month];
    }

    /** 注文データのある年の一覧（降順・当年を含む）。 */
    private function availableYears(): array
    {
        $years = Order::query()
            ->selectRaw('DISTINCT YEAR(completed_at) AS y')
            ->whereNotNull('completed_at')
            ->pluck('y')
            ->map(fn ($v) => (int) $v)
            ->all();
        $years[] = (int) now()->year;

        return collect($years)->unique()->sortDesc()->values()->all();
    }

    private function ordersIn(Carbon $start, Carbon $end): Collection
    {
        return Order::where('status', 'completed')
            ->whereBetween('completed_at', [$start, $end])
            ->get(['id', 'total', 'completed_at', 'dine_type']);
    }

    /**
     * 期間バケット（推移の各行）と全体レンジを返す。
     * 戻り値: [buckets(各 {label,start,end}), rangeStart, rangeEnd]
     */
    private function buckets(string $period, int $year, int $month): array
    {
        $buckets = [];

        if ($period === 'day') {
            $base = Carbon::create($year, $month, 1)->startOfMonth();
            $start = $base->copy()->startOfDay();
            $end = $base->copy()->endOfMonth();
            for ($d = 1; $d <= $base->daysInMonth; $d++) {
                $s = Carbon::create($year, $month, $d)->startOfDay();
                $buckets[] = ['label' => "{$month}/{$d}", 'start' => $s, 'end' => $s->copy()->endOfDay()];
            }
        } elseif ($period === 'year') {
            $endY = (int) now()->year;
            // データのある最初の年から当年まで（無ければ当年のみ）
            $first = Order::where('status', 'completed')->min('completed_at');
            $startY = $first ? Carbon::parse($first)->year : $endY;
            $startY = min($startY, $endY);
            $start = Carbon::create($startY, 1, 1)->startOfDay();
            $end = Carbon::create($endY, 12, 31)->endOfDay();
            for ($y = $startY; $y <= $endY; $y++) {
                $s = Carbon::create($y, 1, 1)->startOfDay();
                $buckets[] = ['label' => (string) $y, 'start' => $s, 'end' => $s->copy()->endOfYear()];
            }
        } else { // month
            $start = Carbon::create($year, 1, 1)->startOfDay();
            $end = Carbon::create($year, 12, 31)->endOfDay();
            for ($m = 1; $m <= 12; $m++) {
                $s = Carbon::create($year, $m, 1)->startOfMonth();
                $buckets[] = ['label' => "{$m}月", 'start' => $s, 'end' => $s->copy()->endOfMonth()];
            }
        }

        return [$buckets, $start, $end];
    }

    private function categoryComposition(Collection $items, int $totalSales): array
    {
        $palette = ['var(--brown)', 'var(--brown-2)', 'var(--gold)', 'var(--leaf)', 'var(--accent)'];

        $grouped = $items
            ->groupBy(fn (OrderItem $i) => optional(optional($i->product)->category)->label ?? 'その他')
            ->map(fn ($g) => (int) $g->sum('line_total'))
            ->sortDesc();

        $out = [];
        $idx = 0;
        foreach ($grouped as $label => $amt) {
            $out[] = [
                'label' => $label,
                'value' => $amt,
                'pct' => $totalSales ? round($amt / $totalSales * 100) : 0,
                'color' => $palette[$idx % count($palette)],
            ];
            $idx++;
        }

        return $out;
    }

    private function productRanking(Collection $items, int $totalSales, int $limit = 8): array
    {
        return $items->groupBy('name')
            ->map(fn ($g) => [
                'name' => $g->first()->name,
                'qty' => (int) $g->sum('qty'),
                'amt' => (int) $g->sum('line_total'),
            ])
            ->sortByDesc('amt')
            ->values()
            ->take($limit)
            ->map(fn ($r) => [...$r, 'pct' => $totalSales ? round($r['amt'] / $totalSales * 100, 1) : 0])
            ->all();
    }
}
