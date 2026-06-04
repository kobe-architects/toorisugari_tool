<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    /** 名目マスタ一覧（有効なもの、原価→経費の順）。 */
    public function index()
    {
        return ExpenseCategory::where('is_active', true)
            ->orderByRaw("FIELD(type, 'cost', 'expense')")
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'name', 'type', 'sort_order', 'is_active']);
    }

    public function store(Request $request)
    {
        $cat = ExpenseCategory::create($this->validateData($request, true));

        return response()->json($cat->only(['id', 'name', 'type', 'sort_order', 'is_active']), 201);
    }

    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        $expenseCategory->update($this->validateData($request, false));

        return $expenseCategory->only(['id', 'name', 'type', 'sort_order', 'is_active']);
    }

    public function destroy(ExpenseCategory $expenseCategory)
    {
        $expenseCategory->delete();

        return response()->noContent();
    }

    private function validateData(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'name' => [$required, 'string', 'max:40'],
            'type' => [$required, 'in:cost,expense'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);
    }
}
