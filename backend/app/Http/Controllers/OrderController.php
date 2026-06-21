<?php

namespace App\Http\Controllers;

use App\Models\CustomerAttribute;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * 会計確定。明細・客層をトランザクションで保存し、日次採番した伝票番号を返す。
     * 価格はクライアントを信用せずサーバ側の商品マスタから再計算する。
     */
    public function store(Request $request)
    {
        $data = $request->validate($this->orderRules());

        [$lines, $subtotal, $tax] = $this->buildLines($data['items']);
        $total = $subtotal;

        if ($data['received'] < $total) {
            throw ValidationException::withMessages([
                'received' => 'お預かり金額が合計金額に足りません。',
            ]);
        }

        $order = DB::transaction(function () use ($data, $lines, $subtotal, $tax, $total, $request) {
            // その日の伝票番号（日次連番）。同日内の最大+1。
            $today = now()->toDateString();
            $seq = Order::whereDate('completed_at', $today)->lockForUpdate()->count() + 1;

            $order = Order::create([
                'order_no' => (string) $seq,
                'staff_id' => $request->user()->id,
                'dine_type' => $data['dine_type'],
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'received' => $data['received'],
                'change' => $data['received'] - $total,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            foreach ($lines as $line) {
                $order->items()->create($line);
            }

            $cust = $data['customer'] ?? null;
            if ($cust && (! empty($cust['gender']) || ! empty($cust['age_band']))) {
                $order->customerAttribute()->create([
                    'gender' => $cust['gender'] ?? null,
                    'age_band' => $cust['age_band'] ?? null,
                ]);
            }

            return $order;
        });

        return response()->json($this->present($order->load('items')), 201);
    }

    /**
     * 伝票一覧（オーナー管理）。ステータス・伝票番号・期間で絞り込み、ページネーションして返す。
     */
    public function index(Request $request)
    {
        $params = $request->validate([
            'status' => ['nullable', 'in:completed,voided'],
            'q' => ['nullable', 'string', 'max:40'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort' => ['nullable', 'in:order_no,completed_at,dine_type,item_count,total,status'],
            'dir' => ['nullable', 'in:asc,desc'],
        ]);

        $perPage = $params['per_page'] ?? 20;
        $sort = $params['sort'] ?? 'completed_at';
        $dir = $params['dir'] ?? 'desc';

        $query = Order::query()
            ->with('staff:id,name')
            ->withCount('items as item_count');

        // order_no は日次連番の文字列なので数値順に並べ替える
        if ($sort === 'order_no') {
            $query->orderByRaw('CAST(order_no AS UNSIGNED) '.$dir);
        } else {
            $query->orderBy($sort, $dir);
        }
        $query->orderByDesc('id');

        if (! empty($params['status'])) {
            $query->where('status', $params['status']);
        }
        if (! empty($params['q'])) {
            $query->where('order_no', 'like', '%'.$params['q'].'%');
        }
        if (! empty($params['from'])) {
            $query->whereDate('completed_at', '>=', $params['from']);
        }
        if (! empty($params['to'])) {
            $query->whereDate('completed_at', '<=', $params['to']);
        }

        $page = $query->paginate($perPage);

        return [
            'data' => collect($page->items())->map(fn (Order $o) => [
                'id' => $o->id,
                'order_no' => $o->order_no,
                'status' => $o->status,
                'dine_type' => $o->dine_type,
                'total' => $o->total,
                'item_count' => (int) $o->item_count,
                'staff' => $o->staff?->name,
                'completed_at' => $o->completed_at?->toIso8601String(),
            ])->all(),
            'page' => $page->currentPage(),
            'per_page' => $page->perPage(),
            'total' => $page->total(),
            'last_page' => $page->lastPage(),
        ];
    }

    /** 伝票詳細（編集フォーム復元用の全項目）。 */
    public function show(Order $order)
    {
        return $this->presentDetail($order->load(['items', 'customerAttribute', 'staff:id,name']));
    }

    /**
     * 伝票編集。明細をサーバ側で再計算して保存し直す。
     * order_no・completed_at・staff_id・status は保持する。
     */
    public function update(Request $request, Order $order)
    {
        $data = $request->validate($this->orderRules());

        [$lines, $subtotal, $tax] = $this->buildLines($data['items']);
        $total = $subtotal;

        if ($data['received'] < $total) {
            throw ValidationException::withMessages([
                'received' => 'お預かり金額が合計金額に足りません。',
            ]);
        }

        DB::transaction(function () use ($data, $lines, $subtotal, $tax, $total, $order) {
            $order->update([
                'dine_type' => $data['dine_type'],
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'payment_method' => $data['payment_method'] ?? $order->payment_method,
                'received' => $data['received'],
                'change' => $data['received'] - $total,
            ]);

            // 明細は全削除して作り直す（数量・温度・経路・オプションの増減に対応）。
            $order->items()->delete();
            foreach ($lines as $line) {
                $order->items()->create($line);
            }

            $cust = $data['customer'] ?? null;
            if ($cust && (! empty($cust['gender']) || ! empty($cust['age_band']))) {
                $order->customerAttribute()->updateOrCreate(
                    ['order_id' => $order->id],
                    ['gender' => $cust['gender'] ?? null, 'age_band' => $cust['age_band'] ?? null],
                );
            } else {
                $order->customerAttribute()->delete();
            }
        });

        return $this->presentDetail($order->fresh(['items', 'customerAttribute', 'staff:id,name']));
    }

    /** 伝票取消（論理削除）。status を voided にする。冪等。 */
    public function void(Order $order)
    {
        $order->update(['status' => 'voided']);

        return $this->presentDetail($order->fresh(['items', 'customerAttribute', 'staff:id,name']));
    }

    /** store / update 共通の検証ルール。 */
    private function orderRules(): array
    {
        return [
            'dine_type' => ['required', 'in:dine_in,takeout'],
            'payment_method' => ['nullable', 'in:cash'], // MVPは現金のみ
            'received' => ['required', 'integer', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.temperature' => ['nullable', 'in:hot,ice'],
            'items.*.order_source' => ['nullable', 'in:direct,tasting'],
            'items.*.options' => ['nullable', 'array'],
            'items.*.options.*.name' => ['required_with:items.*.options', 'string', 'max:40'],
            'items.*.options.*.value' => ['required_with:items.*.options', 'string', 'max:40'],
            'customer' => ['nullable', 'array'],
            'customer.gender' => ['nullable', 'in:female,male,other'],
            'customer.age_band' => ['nullable', 'in:10s,20s,30s,40s,50s,60plus'],
        ];
    }

    /**
     * 明細をサーバ側の商品マスタから再計算する（税込価格・内税）。
     * 戻り値: [lines(配列), subtotal, tax]。
     */
    private function buildLines(array $items): array
    {
        $ids = collect($items)->pluck('product_id')->all();
        $products = Product::whereIn('id', $ids)->get()->keyBy('id');

        $lines = [];
        $subtotal = 0;
        $tax = 0;
        foreach ($items as $item) {
            $p = $products[$item['product_id']];
            $qty = $item['qty'];
            $temp = $item['temperature'] ?? null;
            $opts = $item['options'] ?? [];
            $lineTotal = $p->price * $qty;
            $rate = (float) $p->tax_rate / 100;
            $lineTax = $lineTotal - (int) round($lineTotal / (1 + $rate));

            // 選択（産地など）＋温度を名前サフィックスに（例: みなみさやか（宮崎・ホット））
            $parts = [];
            foreach ($opts as $o) {
                if (! empty($o['value'])) {
                    $parts[] = $o['value'];
                }
            }
            if ($temp === 'hot') {
                $parts[] = 'ホット';
            } elseif ($temp === 'ice') {
                $parts[] = 'アイス';
            }
            $suffix = $parts ? '（'.implode('・', $parts).'）' : '';

            $subtotal += $lineTotal;
            $tax += $lineTax;
            $lines[] = [
                'product_id' => $p->id,
                'temperature' => $temp,
                'order_source' => $item['order_source'] ?? 'direct',
                'options' => $opts ?: null,
                'name' => $p->name.$suffix,
                'price' => $p->price,
                'qty' => $qty,
                'line_total' => $lineTotal,
            ];
        }

        return [$lines, $subtotal, $tax];
    }

    /** 完了画面・レシート用の整形レスポンス。 */
    private function present(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_no' => $order->order_no,
            'dine_type' => $order->dine_type,
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'total' => $order->total,
            'payment_method' => $order->payment_method,
            'received' => $order->received,
            'change' => $order->change,
            'completed_at' => $order->completed_at?->toIso8601String(),
            'items' => $order->items->map(fn (OrderItem $i) => [
                'name' => $i->name,
                'price' => $i->price,
                'qty' => $i->qty,
                'line_total' => $i->line_total,
            ])->all(),
        ];
    }

    /** 伝票管理（閲覧・編集）用の詳細レスポンス。 */
    private function presentDetail(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_no' => $order->order_no,
            'status' => $order->status,
            'dine_type' => $order->dine_type,
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'total' => $order->total,
            'payment_method' => $order->payment_method,
            'received' => $order->received,
            'change' => $order->change,
            'completed_at' => $order->completed_at?->toIso8601String(),
            'staff' => $order->staff?->name,
            'items' => $order->items->map(fn (OrderItem $i) => [
                'id' => $i->id,
                'product_id' => $i->product_id,
                'name' => $i->name,
                'price' => $i->price,
                'qty' => $i->qty,
                'line_total' => $i->line_total,
                'temperature' => $i->temperature,
                'order_source' => $i->order_source,
                'options' => $i->options ?? [],
            ])->all(),
            'customer' => $order->customerAttribute ? [
                'gender' => $order->customerAttribute->gender,
                'age_band' => $order->customerAttribute->age_band,
            ] : null,
        ];
    }
}
