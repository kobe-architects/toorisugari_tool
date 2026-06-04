<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public const DEFAULT_CASH_PRESETS = [1000, 5000, 10000];

    /** レジ設定の取得（スタッフも閲覧）。 */
    public function index()
    {
        return [
            'cash_presets' => Setting::get('cash_presets', self::DEFAULT_CASH_PRESETS),
        ];
    }

    /** レジ設定の更新（オーナーのみ）。 */
    public function update(Request $request)
    {
        $data = $request->validate([
            'cash_presets' => ['required', 'array', 'max:8'],
            'cash_presets.*' => ['integer', 'min:1', 'max:1000000'],
        ]);

        // 重複排除・昇順
        $presets = collect($data['cash_presets'])->unique()->sort()->values()->all();
        Setting::put('cash_presets', $presets);

        return $this->index();
    }
}
