<?php

namespace App\Support;

use App\Models\Setting;

/**
 * 地域の既定値・解決。
 * POSレジのログイン時デフォルト、および天気表示のフォールバックに使う。
 * オーナーがシステム設定で地域を選んでいればそれを、無ければ指宿市（鹿児島県）を使う。
 */
class Region
{
    /** フォールバック地域：鹿児島県指宿市。 */
    public const DEFAULT = [
        'name' => '指宿市',
        'label' => '指宿市, 鹿児島県',
        'latitude' => 31.2508,
        'longitude' => 130.6331,
        'timezone' => 'Asia/Tokyo',
    ];

    /** 有効なデフォルト地域（システム設定 > 指宿市）。 */
    public static function effectiveDefault(): array
    {
        $r = Setting::get('region', null);
        if (is_array($r) && isset($r['latitude'], $r['longitude'])) {
            return $r;
        }

        return self::DEFAULT;
    }
}
