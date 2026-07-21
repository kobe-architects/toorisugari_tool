<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\MaterialPurchase;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** 茶葉マスタと仕入の管理（オーナー専用）。 */
class MaterialController extends Controller
{
    /** 茶葉一覧（残量・移動平均g単価・使用商品つき）。 */
    public function index()
    {
        return Material::query()
            ->with(['productMaterials.product:id,name'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Material $m) => $this->present($m));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80', 'unique:materials,name'],
            'low_stock_g' => ['nullable', 'numeric', 'min:0'],
        ]);
        $data['sort_order'] = (int) Material::max('sort_order') + 1;
        $material = Material::create($data);

        return response()->json($this->present($material->load('productMaterials.product:id,name')), 201);
    }

    public function update(Request $request, Material $material)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:80', 'unique:materials,name,'.$material->id],
            'low_stock_g' => ['nullable', 'numeric', 'min:0'],
        ]);
        $material->update($data);

        return $this->present($material->fresh(['productMaterials.product:id,name']));
    }

    public function destroy(Material $material)
    {
        if ($material->productMaterials()->exists()) {
            throw ValidationException::withMessages([
                'material' => '商品に紐付いている茶葉は削除できません。先に商品側の使用茶葉を外してください。',
            ]);
        }
        $material->delete(); // 仕入履歴はcascade削除、消費記録は material_id=null で保持

        return response()->noContent();
    }

    /** 仕入履歴（新しい順）。 */
    public function purchases(Material $material)
    {
        return $material->purchases()
            ->orderByDesc('purchased_on')
            ->orderByDesc('id')
            ->get()
            ->map(fn (MaterialPurchase $p) => $this->presentPurchase($p));
    }

    /** 仕入登録。登録後に残量・移動平均g単価を再計算する（この時点では原価に計上しない）。 */
    public function storePurchase(Request $request)
    {
        $data = $request->validate([
            'material_id' => ['required', 'integer', 'exists:materials,id'],
            'purchased_on' => ['required', 'date'],
            'quantity_g' => ['required', 'numeric', 'min:0.1'],
            'total_price' => ['required', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:120'],
        ]);

        $purchase = MaterialPurchase::create($data);
        $purchase->material->recalcLedger();

        return response()->json([
            'purchase' => $this->presentPurchase($purchase),
            'material' => $this->present($purchase->material->fresh(['productMaterials.product:id,name'])),
        ], 201);
    }

    /** 仕入の削除（誤登録の取り消し）。残量・移動平均を再計算する。 */
    public function destroyPurchase(MaterialPurchase $purchase)
    {
        $material = $purchase->material;
        $purchase->delete();
        $material->recalcLedger();

        return $this->present($material->fresh(['productMaterials.product:id,name']));
    }

    private function present(Material $m): array
    {
        return [
            'id' => $m->id,
            'name' => $m->name,
            'stock_g' => (float) $m->stock_g,
            'avg_unit_price' => (float) $m->avg_unit_price,
            'low_stock_g' => $m->low_stock_g !== null ? (float) $m->low_stock_g : null,
            'products' => $m->productMaterials
                ->filter(fn ($pm) => $pm->product)
                ->map(fn ($pm) => ['id' => $pm->product->id, 'name' => $pm->product->name, 'grams' => (float) $pm->grams])
                ->values()
                ->all(),
        ];
    }

    private function presentPurchase(MaterialPurchase $p): array
    {
        return [
            'id' => $p->id,
            'material_id' => $p->material_id,
            'purchased_on' => $p->purchased_on->toDateString(),
            'quantity_g' => (float) $p->quantity_g,
            'total_price' => $p->total_price,
            'unit_price' => $p->quantity_g > 0 ? round($p->total_price / (float) $p->quantity_g, 2) : 0,
            'note' => $p->note,
        ];
    }
}
