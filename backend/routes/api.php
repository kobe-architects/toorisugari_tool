<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\SettingsController;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — フェーズ1: 疎通確認用の最小エンドポイント
| 本実装（認証・会計・分析）はフェーズ3以降でコントローラに切り出す。
|--------------------------------------------------------------------------
*/

// ヘルスチェック（フロント／さくらデプロイ疎通確認用）
Route::get('/health', fn () => [
    'ok' => true,
    'app' => config('app.name'),
    'time' => now()->toIso8601String(),
]);

// 商品一覧（注文画面の動作確認用・公開）
Route::get('/products', function () {
    return Category::query()
        ->orderBy('sort_order')
        ->with(['products' => fn ($q) => $q->where('is_visible', true)->orderBy('sort_order')])
        ->get()
        ->map(fn ($cat) => [
            'id' => $cat->slug,
            'label' => $cat->label,
            'sub' => $cat->sub,
            'items' => $cat->products->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sub' => $p->sub,
                'price' => $p->price,
                'icon' => $p->icon,
                'image' => $p->imageUrl(),
                'stamp' => $p->stamp,
                'sold' => $p->is_sold_out,
                'has_temperature' => $p->has_temperature,
                'options' => $p->options ?? [],
            ]),
        ]);
});

// レジ設定（プリセット金額など・非機密のため公開）
Route::get('/settings', [SettingsController::class, 'index']);

// ---- 認証 ----
Route::get('/staff', [AuthController::class, 'staff']);
Route::post('/auth/pin', [AuthController::class, 'pinLogin']);    // レジ（スタッフPIN）
Route::post('/auth/login', [AuthController::class, 'login']);     // PC分析（オーナー メール）

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn (Request $request) => $request->user());

    // 会計確定（DB保存）
    Route::post('/orders', [OrderController::class, 'store']);

    // ---- 管理（オーナー専用） ----
    Route::middleware('owner')->prefix('admin')->group(function () {
        Route::get('/summary/today', [AdminController::class, 'summaryToday']);
        Route::get('/categories', [AdminController::class, 'categories']);
        Route::get('/products', [AdminController::class, 'products']);
        Route::post('/products', [AdminController::class, 'storeProduct']);
        Route::patch('/products/{product}', [AdminController::class, 'updateProduct']);
        Route::delete('/products/{product}', [AdminController::class, 'destroyProduct']);
        Route::post('/products/{product}/image', [AdminController::class, 'uploadImage']);
        Route::delete('/products/{product}/image', [AdminController::class, 'deleteImage']);

        // レジ設定の更新
        Route::patch('/settings', [SettingsController::class, 'update']);
    });

    // ---- PC分析（オーナー専用） ----
    Route::middleware('owner')->prefix('analytics')->group(function () {
        Route::get('/sales', [AnalyticsController::class, 'sales']);
        Route::get('/sales.csv', [AnalyticsController::class, 'salesCsv']);
        Route::get('/customers', [AnalyticsController::class, 'customers']);
        Route::get('/profit', [AnalyticsController::class, 'profit']);
    });

    // ---- 経費管理・名目マスタ（オーナー専用） ----
    Route::middleware('owner')->group(function () {
        Route::get('/expense-categories', [ExpenseCategoryController::class, 'index']);
        Route::post('/expense-categories', [ExpenseCategoryController::class, 'store']);
        Route::patch('/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'update']);
        Route::delete('/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'destroy']);

        Route::get('/expenses', [ExpenseController::class, 'index']);
        Route::post('/expenses', [ExpenseController::class, 'store']);
        Route::patch('/expenses/{expense}', [ExpenseController::class, 'update']);
        Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);
    });
});
