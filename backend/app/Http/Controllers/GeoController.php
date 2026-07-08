<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * ジオコーディング（地域名⇄緯度経度）。POSレジ・PC管理の双方から使用（ログイン必須）。
 * - search  : 地域名 → 候補（Open-Meteo ジオコーディング）
 * - reverse : 緯度経度 → 地域名（BigDataCloud リバースジオコーディング／APIキー不要）
 * どちらも通信失敗時は握りつぶし、機能を止めない設計。
 */
class GeoController extends Controller
{
    /** 地域名の検索。候補（名称・都道府県・国・緯度経度・タイムゾーン）を返す。 */
    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        if ($q === '') {
            return ['results' => []];
        }

        try {
            $resp = Http::timeout(8)->get('https://geocoding-api.open-meteo.com/v1/search', [
                'name' => $q,
                'count' => 8,
                'language' => 'ja',
                'format' => 'json',
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => '地域の検索に失敗しました（ネットワークエラー）'], 502);
        }

        if (! $resp->ok()) {
            return response()->json(['message' => '地域の検索に失敗しました'], 502);
        }

        $results = collect($resp->json('results') ?? [])->map(function ($r) {
            $parts = array_filter([$r['name'] ?? null, $r['admin1'] ?? null, $r['country'] ?? null]);

            return [
                'name' => $r['name'] ?? '',
                'label' => implode(', ', $parts),
                'latitude' => $r['latitude'] ?? null,
                'longitude' => $r['longitude'] ?? null,
                'timezone' => $r['timezone'] ?? 'Asia/Tokyo',
            ];
        })->values()->all();

        return ['results' => $results];
    }

    /** GPS座標 → 地域名。解決できない場合も座標ベースの地域を返す（GPSは有効なため）。 */
    public function reverse(Request $request)
    {
        $data = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
        ]);
        $lat = round((float) $data['lat'], 4);
        $lon = round((float) $data['lon'], 4);

        $name = null;
        $label = null;
        try {
            $resp = Http::timeout(8)->get('https://api.bigdatacloud.net/data/reverse-geocode-client', [
                'latitude' => $lat,
                'longitude' => $lon,
                'localityLanguage' => 'ja',
            ]);
            if ($resp->ok()) {
                $j = $resp->json();
                $name = $j['city'] ?? $j['locality'] ?? $j['principalSubdivision'] ?? null;
                $parts = array_filter([
                    $j['locality'] ?? $j['city'] ?? null,
                    $j['principalSubdivision'] ?? null,
                    $j['countryName'] ?? null,
                ]);
                $label = $parts ? implode(', ', array_unique($parts)) : null;
            }
        } catch (\Throwable $e) {
            // フォールバック（座標のみ）で継続
        }

        $name = $name ?: '現在地';
        $label = $label ?: "現在地（{$lat}, {$lon}）";

        return [
            'result' => [
                'name' => $name,
                'label' => $label,
                'latitude' => $lat,
                'longitude' => $lon,
                'timezone' => 'Asia/Tokyo',
            ],
        ];
    }
}
