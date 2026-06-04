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

// ルートは当面レジへ誘導
Route::get('/', fn () => redirect('/pos/'));

/** ビルド済みSPAの index.html を返す */
function serveSpa(string $app): \Symfony\Component\HttpFoundation\Response
{
    $index = public_path("{$app}/index.html");
    abort_unless(is_file($index), 404, "SPA [{$app}] is not built yet. Run: npm run build:{$app}");

    return response(file_get_contents($index), 200, ['Content-Type' => 'text/html']);
}

Route::get('/pos', fn () => serveSpa('pos'));
Route::get('/pos/{any}', fn () => serveSpa('pos'))->where('any', '.*');

Route::get('/pc', fn () => serveSpa('pc'));
Route::get('/pc/{any}', fn () => serveSpa('pc'))->where('any', '.*');
