<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /** 管理ホーム用：本日の売上要約。 */
    public function summaryToday()
    {
        $today = now()->toDateString();
        $orders = Order::whereDate('completed_at', $today)->where('status', 'completed')->get();

        $count = $orders->count();
        $total = (int) $orders->sum('total');
        $itemCount = (int) OrderItem::whereIn('order_id', $orders->pluck('id'))->sum('qty');
        $dineIn = $orders->where('dine_type', 'dine_in')->count();

        $hours = [];
        for ($h = 10; $h <= 21; $h++) {
            $hours[] = [
                'hour' => $h,
                'total' => (int) $orders->filter(fn (Order $o) => optional($o->completed_at)->hour === $h)->sum('total'),
            ];
        }

        return [
            'date' => $today,
            'total_sales' => $total,
            'order_count' => $count,
            'item_count' => $itemCount,
            'avg_price' => $count ? intdiv($total, $count) : 0,
            'dine_in' => $dineIn,
            'takeout' => $count - $dineIn,
            'hours' => $hours,
        ];
    }

    /** カテゴリ一覧（商品編集のセレクト用）。 */
    public function categories()
    {
        return Category::orderBy('sort_order')->get(['id', 'slug', 'label', 'sub']);
    }

    /** 商品一覧（管理用：非表示・売切も含む全件）。 */
    public function products()
    {
        return Product::with('category:id,slug,label')
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Product $p) => $this->present($p));
    }

    public function storeProduct(Request $request)
    {
        $data = $this->validateProduct($request, true);
        $product = Product::create($data);

        return response()->json($this->present($product->load('category:id,slug,label')), 201);
    }

    public function updateProduct(Request $request, Product $product)
    {
        $data = $this->validateProduct($request, false);
        $product->update($data);

        return $this->present($product->load('category:id,slug,label'));
    }

    public function destroyProduct(Product $product)
    {
        if ($product->image_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($product->image_path);
        }
        $product->delete();

        return response()->noContent();
    }

    /** 商品画像のアップロード（差し替え）。 */
    public function uploadImage(Request $request, Product $product)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'], // 5MBまで
        ]);

        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        if ($product->image_path) {
            $disk->delete($product->image_path);
        }
        $path = $request->file('image')->store('products', 'public');
        $product->update(['image_path' => $path]);

        return $this->present($product->load('category:id,slug,label'));
    }

    /** 商品画像の削除。 */
    public function deleteImage(Product $product)
    {
        if ($product->image_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($product->image_path);
            $product->update(['image_path' => null]);
        }

        return $this->present($product->load('category:id,slug,label'));
    }

    private function validateProduct(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'name' => [$required, 'string', 'max:80'],
            'sub' => ['nullable', 'string', 'max:120'],
            'price' => [$required, 'integer', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'icon' => ['nullable', 'string', 'max:32'],
            'stamp' => ['nullable', 'string', 'max:4'],
            'is_sold_out' => ['boolean'],
            'is_visible' => ['boolean'],
            'has_temperature' => ['boolean'],
            'options' => ['nullable', 'array'],
            'options.*.name' => ['required_with:options', 'string', 'max:40'],
            'options.*.choices' => ['required_with:options', 'array', 'min:1'],
            'options.*.choices.*' => ['string', 'max:40'],
            'sort_order' => ['nullable', 'integer'],
        ]);
    }

    private function present(Product $p): array
    {
        return [
            'id' => $p->id,
            'category_id' => $p->category_id,
            'category' => $p->category ? [
                'id' => $p->category->id,
                'slug' => $p->category->slug,
                'label' => $p->category->label,
            ] : null,
            'name' => $p->name,
            'sub' => $p->sub,
            'price' => $p->price,
            'tax_rate' => (float) $p->tax_rate,
            'icon' => $p->icon,
            'image' => $p->imageUrl(),
            'stamp' => $p->stamp,
            'is_sold_out' => $p->is_sold_out,
            'is_visible' => $p->is_visible,
            'has_temperature' => $p->has_temperature,
            'options' => $p->options ?? [],
            'sort_order' => $p->sort_order,
        ];
    }
}
