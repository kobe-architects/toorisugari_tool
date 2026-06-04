<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /** 指定年月の経費一覧＋合計。 */
    public function index(Request $request)
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $entries = Expense::where('year', $data['year'])
            ->where('month', $data['month'])
            ->orderBy('id')
            ->get(['id', 'year', 'month', 'expense_category_id', 'category', 'amount', 'note']);

        return [
            'entries' => $entries,
            'total' => (int) $entries->sum('amount'),
        ];
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request, true);
        // 名目はマスタから選択必須。名前・区分をスナップショット保存。
        $cat = ExpenseCategory::findOrFail($data['expense_category_id']);
        $data['category'] = $cat->name;
        $data['type'] = $cat->type;

        $expense = Expense::create($data);

        return response()->json($expense->only(['id', 'year', 'month', 'expense_category_id', 'category', 'amount', 'note']), 201);
    }

    public function update(Request $request, Expense $expense)
    {
        $data = $this->validateData($request, false);
        if (isset($data['expense_category_id'])) {
            $cat = ExpenseCategory::findOrFail($data['expense_category_id']);
            $data['category'] = $cat->name;
            $data['type'] = $cat->type;
        }

        $expense->update($data);

        return $expense->only(['id', 'year', 'month', 'expense_category_id', 'category', 'amount', 'note']);
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return response()->noContent();
    }

    private function validateData(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'year' => [$required, 'integer', 'min:2000', 'max:2100'],
            'month' => [$required, 'integer', 'min:1', 'max:12'],
            'expense_category_id' => [$required, 'integer', 'exists:expense_categories,id'],
            'amount' => [$required, 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:120'],
        ]);
    }
}
