<?php

namespace App\Http\Controllers;

use App\Models\OperatingDay;
use App\Support\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * 営業日の地域設定（POSレジのログイン時に設定）。ログイン中のスタッフが操作する。
 * 未設定日の既定は、システム設定（Setting 'region'）の「POSログイン時デフォルト地域」。
 */
class OperatingDayController extends Controller
{
    /** 本日の地域設定と、デフォルト地域（システム設定）を返す。 */
    public function today()
    {
        $today = Carbon::now('Asia/Tokyo')->toDateString();
        $record = OperatingDay::whereDate('date', $today)->first();

        return [
            'date' => $today,
            'region' => $record?->region,
            'source' => $record?->source,
            'default' => Region::effectiveDefault(),
        ];
    }

    /** 本日の地域を設定（GPS / デフォルト / 検索の結果を保存）。 */
    public function store(Request $request)
    {
        $data = $request->validate([
            'region' => ['required', 'array'],
            'region.name' => ['required', 'string', 'max:120'],
            'region.label' => ['nullable', 'string', 'max:200'],
            'region.latitude' => ['required', 'numeric', 'between:-90,90'],
            'region.longitude' => ['required', 'numeric', 'between:-180,180'],
            'region.timezone' => ['nullable', 'string', 'max:64'],
            'source' => ['nullable', 'string', 'in:gps,default,search,manual'],
        ]);

        $r = $data['region'];
        $region = [
            'name' => $r['name'],
            'label' => $r['label'] ?? $r['name'],
            'latitude' => round((float) $r['latitude'], 4),
            'longitude' => round((float) $r['longitude'], 4),
            'timezone' => $r['timezone'] ?: 'Asia/Tokyo',
        ];

        $today = Carbon::now('Asia/Tokyo')->toDateString();
        $record = OperatingDay::updateOrCreate(
            ['date' => $today],
            ['region' => $region, 'source' => $data['source'] ?? 'manual', 'set_by' => $request->user()?->id],
        );

        return [
            'date' => $today,
            'region' => $record->region,
            'source' => $record->source,
        ];
    }
}
