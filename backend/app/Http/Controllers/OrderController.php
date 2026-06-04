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
        $data = $request->validate([
            'dine_type' => ['required', 'in:dine_in,takeout'],
            'payment_method' => ['nullable', 'in:cash'], // MVPは現金のみ
            'received' => ['required', 'integer', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.temperature' => ['nullable', 'in:hot,ice'],
            'customer' => ['nullable', 'array'],
            'customer.gender' => ['nullable', 'in:female,male,other'],
            'customer.age_band' => ['nullable', 'in:10s,20s,30s,40s,50s,60plus'],
        ]);

        $ids = collect($data['items'])->pluck('product_id')->all();
        $products = Product::whereIn('id', $ids)->get()->keyBy('id');

        // サーバ側で明細・金額を再計算（税込価格・内税）
        $lines = [];
        $subtotal = 0;
        $tax = 0;
        foreach ($data['items'] as $item) {
            $p = $products[$item['product_id']];
            $qty = $item['qty'];
            $temp = $item['temperature'] ?? null;
            $lineTotal = $p->price * $qty;
            $rate = (float) $p->tax_rate / 100;
            $lineTax = $lineTotal - (int) round($lineTotal / (1 + $rate));

            $suffix = match ($temp) {
                'hot' => '（ホット）',
                'ice' => '（アイス）',
                default => '',
            };

            $subtotal += $lineTotal;
            $tax += $lineTax;
            $lines[] = [
                'product_id' => $p->id,
                'temperature' => $temp,
                'name' => $p->name.$suffix,
                'price' => $p->price,
                'qty' => $qty,
                'line_total' => $lineTotal,
            ];
        }
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
}
