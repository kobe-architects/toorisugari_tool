<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\Region;
use Illuminate\Http\Request;

/**
 * システム設定（オーナー専用）。
 *
 * 現状は「地域」設定のみを扱う。ここで設定する地域は、POSレジのログイン時に使う
 * 「デフォルト地域」であり、settings テーブルの 'region' キーに保持する。
 * 未設定時のフォールバックは指宿市（App\Support\Region::DEFAULT）。
 * 各営業日の実際の地域は POS 側で設定し（OperatingDay）、天気表示はそれを優先する。
 */
class SystemSettingController extends Controller
{
    /** システム設定の取得。region は保存値（未設定なら null）、fallback は既定地域。 */
    public function index()
    {
        return [
            'region' => Setting::get('region', null),
            'fallback' => Region::DEFAULT,
        ];
    }

    /** 地域の保存。フロントで選んだジオコーディング候補をそのまま受け取る。 */
    public function update(Request $request)
    {
        $data = $request->validate([
            'region' => ['nullable', 'array'],
            'region.name' => ['required_with:region', 'string', 'max:120'],
            'region.label' => ['nullable', 'string', 'max:200'],
            'region.latitude' => ['required_with:region', 'numeric', 'between:-90,90'],
            'region.longitude' => ['required_with:region', 'numeric', 'between:-180,180'],
            'region.timezone' => ['nullable', 'string', 'max:64'],
        ]);

        $region = $data['region'] ?? null;
        if ($region) {
            $region = [
                'name' => $region['name'],
                'label' => $region['label'] ?? $region['name'],
                'latitude' => round((float) $region['latitude'], 4),
                'longitude' => round((float) $region['longitude'], 4),
                'timezone' => $region['timezone'] ?: 'Asia/Tokyo',
            ];
        }
        Setting::put('region', $region);

        return $this->index();
    }
}
