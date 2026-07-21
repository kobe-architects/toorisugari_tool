<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
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
        $category = $request->query('category') ?: null; // カテゴリslug（null=全体）

        $orders = $this->ordersIn($start, $end);
        $items = OrderItem::with(['product.category', 'order:id,completed_at'])->whereIn('order_id', $orders->pluck('id'))->get();
        // カテゴリ指定時は明細ベースで集計（売上=明細合計・会計数=該当明細を含む伝票数）
        $catItems = $category
            ? $items->filter(fn (OrderItem $i) => optional(optional($i->product)->category)->slug === $category)
            : null;

        $rows = $this->trendRows($buckets, $orders, $catItems);
        $total = $catItems !== null ? (int) $catItems->sum('line_total') : (int) $orders->sum('total');

        // 時間帯（選択期間, 10-21時）
        $hours = [];
        for ($h = 10; $h <= 21; $h++) {
            $hours[] = $catItems !== null
                ? (int) $catItems->filter(fn (OrderItem $i) => optional(optional($i->order)->completed_at)->hour === $h)->sum('line_total')
                : (int) $orders->filter(fn (Order $o) => optional($o->completed_at)->hour === $h)->sum('total');
        }
        $peak = $hours ? array_keys($hours, max($hours))[0] : 0;

        $scoped = $catItems ?? $items;

        // 注文経路別（直注文 / 試飲から）
        $bySource = collect(['direct' => '直注文', 'tasting' => '試飲から'])
            ->map(function ($label, $key) use ($scoped) {
                $g = $scoped->where('order_source', $key);
                return ['key' => $key, 'label' => $label, 'amount' => (int) $g->sum('line_total'), 'qty' => (int) $g->sum('qty')];
            })->values()->all();

        return [
            'period' => $period,
            'year' => $year,
            'month' => $month,
            'category' => $category,
            'available_years' => $this->availableYears(),
            'total' => $total,
            'rows' => $rows,
            'hours' => [
                'labels' => array_map('strval', range(10, 21)),
                'data' => $hours,
                'peak' => $peak,
            ],
            'categories' => $this->categoryComposition($items, (int) $orders->sum('total')), // 構成比は常に全体
            'products' => $this->productRanking($scoped),
            'by_source' => $bySource,
        ];
    }

    /** 売上推移の各行。カテゴリ指定時（$catItems）は明細ベース、全体は伝票ベース。 */
    private function trendRows(array $buckets, Collection $orders, ?Collection $catItems): array
    {
        return array_map(function ($b) use ($orders, $catItems) {
            if ($catItems !== null) {
                $in = $catItems->filter(fn (OrderItem $i) => $i->order && $i->order->completed_at->betweenIncluded($b['start'], $b['end']));
                $sales = (int) $in->sum('line_total');
                $count = $in->pluck('order_id')->unique()->count();
            } else {
                $in = $orders->filter(fn (Order $o) => $o->completed_at->betweenIncluded($b['start'], $b['end']));
                $sales = (int) $in->sum('total');
                $count = $in->count();
            }

            return [
                'label' => $b['label'],
                'sales' => $sales,
                'count' => $count,
                'avg' => $count ? intdiv($sales, $count) : 0,
            ];
        }, $buckets);
    }

    /**
     * 損益管理：指定年の月別 売上・費用・営業利益。原価 = 茶葉の自動計上 ＋ 手入力。
     * category（slug）指定時はカテゴリ別損益：売上=明細合計・原価=自動計上分のみ
     * （月単位で手入力する原価・経費はカテゴリに按分できないため 0 として返す）。
     */
    public function profit(Request $request)
    {
        $year = (int) ($request->query('year') ?: now()->year);
        $category = $request->query('category') ?: null;

        $start = Carbon::create($year, 1, 1)->startOfDay();
        $end = Carbon::create($year, 12, 31)->endOfDay();
        $orders = $this->ordersIn($start, $end);
        $expenses = \App\Models\Expense::where('year', $year)->get(['month', 'type', 'amount']);

        // カテゴリ指定時は明細（該当カテゴリ）で月別売上を計算
        $catItems = null;
        if ($category) {
            $catItems = OrderItem::with(['product.category', 'order:id,completed_at'])
                ->whereIn('order_id', $orders->pluck('id'))
                ->get()
                ->filter(fn (OrderItem $i) => optional(optional($i->product)->category)->slug === $category);
        }

        // 販売時に自動計上した原価（月別・カテゴリ指定時は該当カテゴリ商品分のみ）
        $autoCosts = \App\Models\MaterialConsumption::query()
            ->whereBetween('consumed_on', [$start->toDateString(), $end->toDateString()])
            ->when($category, fn ($q) => $q->whereHas('orderItem.product.category', fn ($c) => $c->where('slug', $category)))
            ->selectRaw('MONTH(consumed_on) AS m, SUM(amount) AS amt')
            ->groupBy('m')
            ->pluck('amt', 'm');

        $rows = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthExp = $expenses->where('month', $m);
            $sales = $catItems !== null
                ? (int) $catItems->filter(fn (OrderItem $i) => optional(optional($i->order)->completed_at)->month === $m)->sum('line_total')
                : (int) $orders->filter(fn (Order $o) => optional($o->completed_at)->month === $m)->sum('total');
            $costManual = $category ? 0 : (int) $monthExp->where('type', 'cost')->sum('amount'); // 手入力の原価（全体のみ）
            $costAuto = (int) round((float) ($autoCosts[$m] ?? 0));                              // 自動原価（茶葉・物販）
            $cost = $costManual + $costAuto;
            $expense = $category ? 0 : (int) $monthExp->where('type', 'expense')->sum('amount'); // 経費（全体のみ）
            $gross = $sales - $cost;                 // 粗利益
            $operating = $gross - $expense;          // 営業利益

            $rows[] = [
                'month' => $m,
                'label' => "{$m}月",
                'sales' => $sales,
                'cost' => $cost,
                'cost_auto' => $costAuto,
                'cost_manual' => $costManual,
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
            'category' => $category,
            'available_years' => $this->availableYears(),
            'rows' => $rows,
            'total_sales' => $totalSales,
            'total_cost' => $sum('cost'),
            'total_cost_auto' => $sum('cost_auto'),
            'total_cost_manual' => $sum('cost_manual'),
            'total_gross' => $totalGross,
            'total_expense' => $sum('expense'),
            'total_operating' => $totalOperating,
            'gross_margin' => $totalSales ? round($totalGross / $totalSales * 100, 1) : null,
            'operating_margin' => $totalSales ? round($totalOperating / $totalSales * 100, 1) : null,
        ];
    }

    /**
     * 損益分岐分析（月次）。
     * - 変動費 = 販売時の自動計上原価（茶葉・物販）＋ 手入力の原価
     * - 固定費 = 経費（イベント出店料などの自動計上を含む）
     * - 損益分岐点売上高 = 固定費 ÷ 貢献利益率（= 1 − 変動費率）
     * - 商品別に「分岐点／予算まであと何杯」を返す（1杯あたり貢献利益 = 価格 − 単品変動費）
     */
    public function breakEven(Request $request)
    {
        $year = (int) ($request->query('year') ?: now()->year);
        $month = max(1, min(12, (int) ($request->query('month') ?: now()->month)));

        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $orders = $this->ordersIn($start->copy()->startOfDay(), $end->copy()->endOfDay());
        $sales = (int) $orders->sum('total');

        // 変動費：自動計上（茶葉・物販）＋手入力原価。固定費：経費（出店料含む）
        $varAuto = (int) round((float) \App\Models\MaterialConsumption::whereBetween('consumed_on', [$start->toDateString(), $end->toDateString()])->sum('amount'));
        $monthExp = \App\Models\Expense::where('year', $year)->where('month', $month)->get(['type', 'amount']);
        $varManual = (int) $monthExp->where('type', 'cost')->sum('amount');
        $varCost = $varAuto + $varManual;
        $fixedCost = (int) $monthExp->where('type', 'expense')->sum('amount');

        $contribution = $sales - $varCost;                                   // 貢献利益
        $cmRatio = $sales > 0 ? $contribution / $sales : null;               // 貢献利益率
        $breakEvenSales = ($cmRatio !== null && $cmRatio > 0)
            ? (int) ceil($fixedCost / $cmRatio)
            : null;                                                          // 損益分岐点売上高
        $uncovered = $fixedCost - $contribution;                             // 固定費の未回収額（<=0で黒字）
        $operating = $contribution - $fixedCost;

        $budget = \App\Models\Budget::where('year', $year)->where('month', $month)->first();
        $target = $budget?->target_sales;

        // 月内の販売数（商品別）
        $soldByProduct = OrderItem::whereIn('order_id', $orders->pluck('id'))
            ->get(['product_id', 'qty'])
            ->groupBy('product_id')
            ->map(fn ($g) => (int) $g->sum('qty'));

        // 商品別：1杯あたり変動費（茶葉g×現在の平均g単価＋物販原価）と「あと何杯」
        $products = Product::with(['category:id,slug,label', 'materials.material:id,avg_unit_price'])
            ->where('is_visible', true)
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (Product $p) => $p->price > 0)
            ->map(function (Product $p) use ($uncovered, $sales, $target, $soldByProduct) {
                $unitVar = (float) $p->materials->sum(fn ($pm) => (float) $pm->grams * (float) ($pm->material->avg_unit_price ?? 0));
                $unitVar += (float) ($p->cost_price ?? 0);
                $unitVar = round($unitVar, 1);
                $unitCm = $p->price - $unitVar; // 1杯あたり貢献利益

                // 分岐点まで：未回収固定費 ÷ 1杯あたり貢献利益
                $cupsBreakEven = null;
                if ($uncovered <= 0) {
                    $cupsBreakEven = 0; // 達成済み
                } elseif ($unitCm > 0) {
                    $cupsBreakEven = (int) ceil($uncovered / $unitCm);
                }

                // 予算（売上目標）まで：残り売上 ÷ 価格
                $cupsTarget = null;
                if ($target !== null) {
                    $remain = $target - $sales;
                    $cupsTarget = $remain <= 0 ? 0 : (int) ceil($remain / $p->price);
                }

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'category' => $p->category?->label ?? 'その他',
                    'price' => $p->price,
                    'unit_var_cost' => $unitVar,
                    'unit_cm' => round($unitCm, 1),
                    'sold_qty' => $soldByProduct[$p->id] ?? 0,
                    'cups_to_break_even' => $cupsBreakEven,
                    'cups_to_target' => $cupsTarget,
                ];
            })
            ->values()
            ->all();

        return [
            'year' => $year,
            'month' => $month,
            'available_years' => $this->availableYears(),
            'sales' => $sales,
            'var_cost' => $varCost,
            'var_cost_auto' => $varAuto,
            'var_cost_manual' => $varManual,
            'fixed_cost' => $fixedCost,
            'contribution' => $contribution,
            'cm_ratio' => $cmRatio !== null ? round($cmRatio * 100, 1) : null,
            'break_even_sales' => $breakEvenSales,
            'break_even_achievement' => $breakEvenSales ? round($sales / $breakEvenSales * 100) : null,
            'uncovered' => $uncovered,
            'operating' => $operating,
            'target_sales' => $target,
            'target_achievement' => $target ? round($sales / $target * 100) : null,
            'products' => $products,
        ];
    }

    /** 月次の売上予算を登録・更新（0円で削除）。 */
    public function saveBudget(Request $request)
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'target_sales' => ['required', 'integer', 'min:0'],
        ]);

        if ($data['target_sales'] <= 0) {
            \App\Models\Budget::where('year', $data['year'])->where('month', $data['month'])->delete();

            return ['year' => $data['year'], 'month' => $data['month'], 'target_sales' => null];
        }

        $budget = \App\Models\Budget::updateOrCreate(
            ['year' => $data['year'], 'month' => $data['month']],
            ['target_sales' => $data['target_sales']],
        );

        return ['year' => $budget->year, 'month' => $budget->month, 'target_sales' => $budget->target_sales];
    }

    /**
     * 顧客分析ビュー：客層（性別・年代）を明細単位で集計。
     * 全体に加え、商品別の客層内訳（商品ごとにタップ入力した客層）も返す。
     * 提供数（qty）で重み付けする。
     */
    public function customers()
    {
        $items = OrderItem::query()
            ->whereHas('order', fn ($q) => $q->where('status', 'completed'))
            ->with('product:id,name')
            ->get(['id', 'order_id', 'product_id', 'name', 'gender', 'age_band', 'qty']);

        // 商品別（客層の入力がある明細のみ）。同一商品は温度・オプション違いもまとめる。
        $byProduct = $items
            ->filter(fn (OrderItem $i) => $i->gender || $i->age_band)
            ->groupBy(fn (OrderItem $i) => optional($i->product)->name ?? $i->name)
            ->map(fn (Collection $g, $name) => array_merge(['name' => $name], $this->segmentBreakdown($g)))
            ->sortByDesc('sample_size')
            ->values()
            ->all();

        return array_merge($this->segmentBreakdown($items), ['by_product' => $byProduct]);
    }

    /**
     * 明細コレクションから客層の内訳を算出（性別・年代・平均年齢・最多客層）。
     * 件数は提供数（qty）で重み付け。
     */
    private function segmentBreakdown(Collection $items): array
    {
        $genderLabels = ['female' => '女性', 'male' => '男性', 'other' => 'その他'];
        $ageOrder = ['10s' => '10代', '20s' => '20代', '30s' => '30代', '40s' => '40代', '50s' => '50代', '60plus' => '60代〜'];
        $ageMid = ['10s' => 15, '20s' => 25, '30s' => 35, '40s' => 45, '50s' => 55, '60plus' => 65];

        $withGender = $items->filter(fn (OrderItem $i) => $i->gender);
        $withAge = $items->filter(fn (OrderItem $i) => $i->age_band);
        $gQty = (int) $withGender->sum('qty');
        $aQty = (int) $withAge->sum('qty');

        $gender = collect($genderLabels)->map(function ($label, $key) use ($withGender, $gQty) {
            $n = (int) $withGender->where('gender', $key)->sum('qty');
            return ['label' => $label, 'value' => $n, 'pct' => $gQty ? round($n / $gQty * 100) : 0];
        })->values();

        $age = collect($ageOrder)->map(function ($label, $key) use ($withAge, $aQty) {
            $n = (int) $withAge->where('age_band', $key)->sum('qty');
            return ['label' => $label, 'value' => $n, 'pct' => $aQty ? round($n / $aQty * 100) : 0];
        })->values();

        $avgAge = $aQty
            ? round($withAge->sum(fn (OrderItem $i) => $ageMid[$i->age_band] * $i->qty) / $aQty, 1)
            : null;

        $topGender = $gender->sortByDesc('value')->first();
        $topAge = $age->sortByDesc('value')->first();

        return [
            'sample_size' => (int) $items->filter(fn (OrderItem $i) => $i->gender || $i->age_band)->sum('qty'),
            'avg_age' => $avgAge,
            'top_segment' => $topGender && $topAge && $topGender['value'] > 0 ? "{$topAge['label']}{$topGender['label']}" : '—',
            'gender' => $gender->all(),
            'age' => $age->all(),
        ];
    }

    /** 選択期間の売上推移CSV出力（category指定時はカテゴリ別）。 */
    public function salesCsv(Request $request): StreamedResponse
    {
        [$period, $year, $month] = $this->resolveSelection($request);
        [$buckets, $start, $end] = $this->buckets($period, $year, $month);
        $category = $request->query('category') ?: null;
        $orders = $this->ordersIn($start, $end);

        $catItems = null;
        if ($category) {
            $catItems = OrderItem::with(['product.category', 'order:id,completed_at'])
                ->whereIn('order_id', $orders->pluck('id'))
                ->get()
                ->filter(fn (OrderItem $i) => optional(optional($i->product)->category)->slug === $category);
        }

        $rows = array_map(
            fn ($r) => [$r['label'], $r['sales'], $r['count'], $r['avg']],
            $this->trendRows($buckets, $orders, $catItems)
        );

        $name = "sales_{$period}_{$year}".($period === 'day' ? "-{$month}" : '').($category ? "_{$category}" : '').'.csv';

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

    /** 商品別売上ランキング（カテゴリ別にグループ化。構成比はカテゴリ内比率）。 */
    private function productRanking(Collection $items, int $limit = 8): array
    {
        return $items
            ->groupBy(fn (OrderItem $i) => optional(optional($i->product)->category)->id ?? 0)
            ->map(function (Collection $g) use ($limit) {
                $cat = optional($g->first()->product)->category;
                $catTotal = (int) $g->sum('line_total');
                $rows = $g->groupBy('name')
                    ->map(fn ($p) => [
                        'name' => $p->first()->name,
                        'qty' => (int) $p->sum('qty'),
                        'amt' => (int) $p->sum('line_total'),
                    ])
                    ->sortByDesc('amt')
                    ->values()
                    ->take($limit)
                    ->map(fn ($r) => [...$r, 'pct' => $catTotal ? round($r['amt'] / $catTotal * 100, 1) : 0])
                    ->values()
                    ->all();

                return [
                    'key' => $cat->slug ?? 'other',
                    'label' => $cat->label ?? 'その他',
                    'total' => $catTotal,
                    'sort' => $cat->sort_order ?? PHP_INT_MAX,
                    'rows' => $rows,
                ];
            })
            ->sortBy('sort')
            ->values()
            ->map(fn (array $c) => collect($c)->except('sort')->all())
            ->all();
    }
}
