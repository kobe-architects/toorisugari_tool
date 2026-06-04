<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — SPA配信（ディレクトリ分離）
|--------------------------------------------------------------------------
| /pos … スマホレジ SPA   (frontend/pos → public/pos)
| /pc  … PC分析 SPA       (frontend/pc  → public/pc)
|
| public/pos・public/pc 配下の実ファイル（assets/*）はWebサーバが直接配信し、
| それ以外の深いパスは各 index.html へフォールバック（クライアントルーティング）。
*/

// ビルド済みSPAの index.html を返す（グローバル関数にすると二重読込で再宣言エラーになるためクロージャ）
$serveSpa = function (string $app) {
    $index = public_path("{$app}/index.html");
    abort_unless(is_file($index), 404, "SPA [{$app}] is not built yet.");

    return response(file_get_contents($index), 200, ['Content-Type' => 'text/html']);
};

// ルートは当面レジへ誘導
Route::get('/', fn () => redirect('pos/'));

Route::get('/pos', fn () => $serveSpa('pos'));
Route::get('/pos/{any}', fn () => $serveSpa('pos'))->where('any', '.*');

Route::get('/pc', fn () => $serveSpa('pc'));
Route::get('/pc/{any}', fn () => $serveSpa('pc'))->where('any', '.*');
