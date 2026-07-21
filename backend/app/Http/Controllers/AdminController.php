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
        return Product::with(['category:id,slug,label', 'materials.material:id,name'])
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Product $p) => $this->present($p));
    }

    public function storeProduct(Request $request)
    {
        $data = $this->validateProduct($request, true);
        $materials = $data['materials'] ?? null;
        unset($data['materials']);

        $product = Product::create($data);
        if (is_array($materials) && $this->materialAllowed($product)) {
            $this->syncMaterials($product, $materials);
        }
        $this->enforceCostPrice($product);

        return response()->json($this->present($product->load(['category:id,slug,label', 'materials.material:id,name'])), 201);
    }

    public function updateProduct(Request $request, Product $product)
    {
        $data = $this->validateProduct($request, false);
        $hasMaterials = array_key_exists('materials', $data); // キーが無ければ紐付けは変更しない（POSの部分更新対応）
        $materials = $data['materials'] ?? null;
        unset($data['materials']);

        $product->update($data);
        if (! $this->materialAllowed($product)) {
            $this->syncMaterials($product, []); // 対象外カテゴリは紐付けを解除（カテゴリ変更時も自動クリア）
        } elseif ($hasMaterials) {
            $this->syncMaterials($product, $materials ?? []);
        }
        $this->enforceCostPrice($product);

        return $this->present($product->load(['category:id,slug,label', 'materials.material:id,name']));
    }

    /** 使用茶葉（原価自動計上）はドリンク・飲み比べカテゴリの商品のみ。 */
    private function materialAllowed(Product $product): bool
    {
        return in_array($product->fresh('category')->category?->slug, ['drink', 'tasting'], true);
    }

    /** 原価（1個あたり）は物販カテゴリのみ。対象外なら自動クリア。 */
    private function enforceCostPrice(Product $product): void
    {
        $product->refresh();
        if ($product->cost_price !== null && $product->fresh('category')->category?->slug !== 'goods') {
            $product->update(['cost_price' => null]);
        }
    }

    /** 商品⇔茶葉の紐付けを置き換える。 */
    private function syncMaterials(Product $product, array $materials): void
    {
        $product->materials()->delete();
        foreach ($materials as $m) {
            $product->materials()->create([
                'material_id' => $m['material_id'],
                'grams' => $m['grams'],
            ]);
        }
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
            'cost_price' => ['nullable', 'integer', 'min:0'], // 原価(円/個)。物販カテゴリのみ有効
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'icon' => ['nullable', 'string', 'max:32'],
            'stamp' => ['nullable', 'string', 'max:4'],
            'is_sold_out' => ['boolean'],
            'is_visible' => ['boolean'],
            'has_temperature' => ['boolean'],
            'has_order_source' => ['boolean'],
            'show_on_lp' => ['boolean'],
            'options' => ['nullable', 'array'],
            'options.*.name' => ['required_with:options', 'string', 'max:40'],
            'options.*.choices' => ['required_with:options', 'array', 'min:1'],
            'options.*.choices.*' => ['string', 'max:40'],
            'materials' => ['sometimes', 'nullable', 'array'], // 使用茶葉（1杯あたりg）
            'materials.*.material_id' => ['required', 'integer', 'exists:materials,id'],
            'materials.*.grams' => ['required', 'numeric', 'min:0.1'],
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
            'cost_price' => $p->cost_price,
            'tax_rate' => (float) $p->tax_rate,
            'icon' => $p->icon,
            'image' => $p->imageUrl(),
            'stamp' => $p->stamp,
            'is_sold_out' => $p->is_sold_out,
            'is_visible' => $p->is_visible,
            'has_temperature' => $p->has_temperature,
            'has_order_source' => $p->has_order_source,
            'show_on_lp' => $p->show_on_lp,
            'options' => $p->options ?? [],
            'materials' => $p->relationLoaded('materials')
                ? $p->materials
                    ->filter(fn ($pm) => $pm->material)
                    ->map(fn ($pm) => ['material_id' => $pm->material_id, 'name' => $pm->material->name, 'grams' => (float) $pm->grams])
                    ->values()
                    ->all()
                : [],
            'sort_order' => $p->sort_order,
        ];
    }
}
