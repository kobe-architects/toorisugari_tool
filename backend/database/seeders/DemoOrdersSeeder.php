<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * 分析画面の動作確認用デモ会計データ。過去40日分をランダム生成。
 * 実行: php artisan db:seed --class=DemoOrdersSeeder
 */
class DemoOrdersSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::all();
        $staffIds = User::pluck('id')->all();
        $genders = ['female', 'female', 'male', 'other']; // 女性多め
        $ages = ['20s', '30s', '30s', '40s', '50s', '10s', '60plus'];

        for ($d = 40; $d >= 0; $d--) {
            $day = Carbon::now()->subDays($d);
            $orderCount = random_int(2, 9);
            $seq = 0;

            for ($n = 0; $n < $orderCount; $n++) {
                $seq++;
                $hour = $this->weightedHour();
                $when = $day->copy()->setTime($hour, random_int(0, 59), random_int(0, 59));

                $picked = $products->random(random_int(1, 4));
                $subtotal = 0;
                $tax = 0;
                $lines = [];
                foreach ($picked as $p) {
                    $qty = random_int(1, 2);
                    $lineTotal = $p->price * $qty;
                    $rate = (float) $p->tax_rate / 100;
                    $subtotal += $lineTotal;
                    $tax += $lineTotal - (int) round($lineTotal / (1 + $rate));
                    $lines[] = ['product_id' => $p->id, 'name' => $p->name, 'price' => $p->price, 'qty' => $qty, 'line_total' => $lineTotal];
                }
                $received = (int) (ceil($subtotal / 100) * 100) + (random_int(0, 1) ? 0 : 1000);

                $order = Order::create([
                    'order_no' => (string) $seq,
                    'staff_id' => $staffIds[array_rand($staffIds)],
                    'dine_type' => random_int(1, 10) <= 7 ? 'dine_in' : 'takeout',
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'total' => $subtotal,
                    'payment_method' => 'cash',
                    'received' => $received,
                    'change' => $received - $subtotal,
                    'status' => 'completed',
                    'completed_at' => $when,
                ]);
                foreach ($lines as $line) {
                    $order->items()->create($line);
                }
                // 7割に客層を付与
                if (random_int(1, 10) <= 7) {
                    $order->customerAttribute()->create([
                        'gender' => $genders[array_rand($genders)],
                        'age_band' => $ages[array_rand($ages)],
                    ]);
                }
            }
        }
    }

    /** 昼12-14時と夕18-19時にピークを作る重み付き時間。 */
    private function weightedHour(): int
    {
        $pool = [10, 11, 12, 12, 12, 13, 13, 14, 14, 15, 16, 17, 18, 18, 18, 19, 19, 20, 21];
        return $pool[array_rand($pool)];
    }
}
