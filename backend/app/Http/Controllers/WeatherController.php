<?php

namespace App\Http\Controllers;

use App\Models\OperatingDay;
use App\Models\Order;
use App\Models\WeatherOverride;
use App\Support\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * 天気情報（オーナー専用）。
 *
 * 表示対象は「伝票（会計）が存在する日」のみ。各日は手動登録（WeatherOverride）があれば
 * それを優先し、無ければ日ごとの営業地域（OperatingDay、無ければ既定地域=指宿市）で
 * Open-Meteo から自動取得する。自動取得は地域×年月ごとにキャッシュする。
 */
class WeatherController extends Controller
{
    /** 手動登録で選べるアイコン種別。 */
    public const ICONS = ['sunny', 'partly', 'cloudy', 'rain', 'snow', 'thunder'];

    /** 指定年月の日別天気（売上管理・日次で使用、伝票のある日だけ）。 */
    public function daily(Request $request)
    {
        $year = (int) ($request->query('year') ?: now()->year);
        $month = (int) ($request->query('month') ?: now()->month);
        $month = max(1, min(12, $month));

        $tz = 'Asia/Tokyo';
        $start = Carbon::create($year, $month, 1, 0, 0, 0, $tz)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $today = Carbon::now($tz)->startOfDay();

        $default = Region::effectiveDefault();

        // 伝票（完了）が存在する日だけを対象にする。
        $orderDays = Order::where('status', 'completed')
            ->whereBetween('completed_at', [$start, $end])
            ->pluck('completed_at')
            ->map(fn ($t) => Carbon::parse($t)->toDateString())
            ->unique()
            ->sort()
            ->values();

        if ($orderDays->isEmpty()) {
            return ['configured' => true, 'region' => $this->labelOfRegion($default), 'days' => []];
        }

        // 手動登録（日付キー）。
        $overrides = WeatherOverride::whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get()->keyBy(fn (WeatherOverride $w) => $w->date->toDateString());

        // 営業日ごとの地域（date => region）。
        $ops = [];
        foreach (OperatingDay::whereBetween('date', [$start->toDateString(), $end->toDateString()])->get() as $o) {
            $r = $this->validRegion($o->region);
            if ($r) {
                $ops[$o->date->toDateString()] = $r;
            }
        }

        // 自動取得が必要な日（手動が無い日）を地域ごとに。
        $regionMaps = [];
        foreach ($orderDays as $key) {
            if ($overrides->has($key)) {
                continue;
            }
            $r = $ops[$key] ?? $default;
            $rk = $this->regionKey($r);
            if (! isset($regionMaps[$rk])) {
                $regionMaps[$rk] = $this->rawMonth($r, $start, $end, $today, $year, $month);
            }
        }

        $days = [];
        foreach ($orderDays as $key) {
            if ($overrides->has($key)) {
                $days[] = $this->manualDay($overrides->get($key));

                continue;
            }
            $r = $ops[$key] ?? $default;
            $w = $regionMaps[$this->regionKey($r)][$key] ?? null;
            if ($w === null) {
                continue; // 自動取得できなかった日（後で手動登録できる）
            }
            $days[] = [
                'date' => $key,
                'day' => (int) Carbon::parse($key)->day,
                'code' => $w['code'],
                'icon' => $this->iconOf($w['code']),
                'label' => $this->labelOf($w['code']),
                'tmax' => $w['tmax'],
                'tmin' => $w['tmin'],
                'region' => $this->labelOfRegion($r),
                'source' => 'auto',
            ];
        }

        return [
            'configured' => true,
            'region' => $this->labelOfRegion($default),
            'days' => $days,
        ];
    }

    /** 天気の手動登録・更新（1日分）。自動取得より優先される。 */
    public function saveOverride(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'icon' => ['required', 'string', 'in:'.implode(',', self::ICONS)],
            'tmax' => ['nullable', 'numeric', 'between:-50,60'],
            'tmin' => ['nullable', 'numeric', 'between:-50,60'],
        ]);

        $o = WeatherOverride::updateOrCreate(
            ['date' => $data['date']],
            [
                'icon' => $data['icon'],
                'tmax' => $data['tmax'] ?? null,
                'tmin' => $data['tmin'] ?? null,
            ],
        );

        return $this->manualDay($o);
    }

    /** 手動登録を削除（自動取得に戻す）。 */
    public function deleteOverride(string $date)
    {
        WeatherOverride::whereDate('date', $date)->delete();

        return response()->noContent();
    }

    /** 手動登録レコード → 表示用の日DTO。 */
    private function manualDay(WeatherOverride $o): array
    {
        return [
            'date' => $o->date->toDateString(),
            'day' => (int) $o->date->day,
            'code' => null,
            'icon' => $o->icon,
            'label' => $this->labelOfIcon($o->icon),
            'tmax' => $o->tmax,
            'tmin' => $o->tmin,
            'region' => null,
            'source' => 'manual',
        ];
    }

    private function labelOfRegion(array $region): ?string
    {
        return $region['label'] ?? $region['name'] ?? null;
    }

    /** region 配列が緯度経度を持つ有効なものか検証して返す（無効なら null）。 */
    private function validRegion($region): ?array
    {
        if (! is_array($region) || ! isset($region['latitude'], $region['longitude'])) {
            return null;
        }

        return $region;
    }

    private function regionKey(array $region): string
    {
        return round((float) $region['latitude'], 4).','.round((float) $region['longitude'], 4);
    }

    /** 1地域・1か月分の生データ（date => [code,tmax,tmin]）。キャッシュ経由。 */
    private function rawMonth(array $region, Carbon $start, Carbon $end, Carbon $today, int $year, int $month): array
    {
        $lat = (float) $region['latitude'];
        $lon = (float) $region['longitude'];
        $tz = $region['timezone'] ?? 'Asia/Tokyo';

        // 当月・未来を含む月は短めTTL、完全に過去の月は長めTTL。
        $ttl = $end->lt($today) ? now()->addDays(20) : now()->addMinutes(30);
        $cacheKey = "weather:{$lat}:{$lon}:{$year}-{$month}";

        $map = Cache::get($cacheKey);
        if (! is_array($map) || count($map) === 0) {
            $map = $this->fetchMonth($lat, $lon, $tz, $start, $end, $today);
            if (count($map) > 0) {
                Cache::put($cacheKey, $map, $ttl); // 失敗（空）はキャッシュせず次回再取得
            }
        }

        return $map;
    }

    /** 月内の各日について Open-Meteo から天気を取得し、date => [code,tmax,tmin] を返す。 */
    private function fetchMonth(float $lat, float $lon, string $tz, Carbon $start, Carbon $end, Carbon $today): array
    {
        $raw = [];

        // アーカイブAPI: 6日以上前まで（反映遅延を考慮）。
        $archiveEnd = $today->copy()->subDays(6);
        if ($start->lte($archiveEnd)) {
            $aEnd = $end->lte($archiveEnd) ? $end : $archiveEnd;
            $raw += $this->call('https://archive-api.open-meteo.com/v1/archive', $lat, $lon, $tz, $start, $aEnd);
        }

        // 予報API: 直近5日前〜15日先まで（Open-Meteo の end_date 上限は today+15）。
        $fStart = $start->gt($today->copy()->subDays(5)) ? $start->copy() : $today->copy()->subDays(5);
        $fEnd = $end->lt($today->copy()->addDays(15)) ? $end->copy() : $today->copy()->addDays(15);
        if ($fEnd->gte($fStart)) {
            $raw += $this->call('https://api.open-meteo.com/v1/forecast', $lat, $lon, $tz, $fStart, $fEnd);
        }

        return $raw;
    }

    /** Open-Meteo を1回呼び、date => [code,tmax,tmin] のマップを返す。 */
    private function call(string $url, float $lat, float $lon, string $tz, Carbon $start, Carbon $end): array
    {
        try {
            $resp = Http::timeout(8)->get($url, [
                'latitude' => $lat,
                'longitude' => $lon,
                'timezone' => $tz,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'daily' => 'weather_code,temperature_2m_max,temperature_2m_min',
            ]);
        } catch (\Throwable $e) {
            return []; // 天気は補助情報のため、取得失敗時は空で継続する
        }

        if (! $resp->ok()) {
            return [];
        }

        $daily = $resp->json('daily') ?? [];
        $times = $daily['time'] ?? [];
        $codes = $daily['weather_code'] ?? [];
        $tmax = $daily['temperature_2m_max'] ?? [];
        $tmin = $daily['temperature_2m_min'] ?? [];

        $map = [];
        foreach ($times as $i => $date) {
            if (! isset($codes[$i]) || $codes[$i] === null) {
                continue;
            }
            $map[$date] = [
                'code' => (int) $codes[$i],
                'tmax' => isset($tmax[$i]) && $tmax[$i] !== null ? round((float) $tmax[$i], 1) : null,
                'tmin' => isset($tmin[$i]) && $tmin[$i] !== null ? round((float) $tmin[$i], 1) : null,
            ];
        }

        return $map;
    }

    /** WMO 天気コード → フロントのアイコン種別。 */
    private function iconOf(int $code): string
    {
        return match (true) {
            $code === 0 => 'sunny',
            in_array($code, [1, 2], true) => 'partly',
            in_array($code, [3, 45, 48], true) => 'cloudy',
            in_array($code, [71, 73, 75, 77, 85, 86], true) => 'snow',
            in_array($code, [95, 96, 99], true) => 'thunder',
            default => 'rain', // 51-67, 80-82 など
        };
    }

    /** WMO 天気コード → 日本語ラベル。 */
    private function labelOf(int $code): string
    {
        return match (true) {
            $code === 0 => '晴れ',
            $code === 1 => '晴れ時々曇り',
            $code === 2 => '晴れ時々曇り',
            $code === 3 => '曇り',
            in_array($code, [45, 48], true) => '霧',
            in_array($code, [51, 53, 55, 56, 57], true) => '霧雨',
            in_array($code, [61, 63, 65, 66, 67, 80, 81, 82], true) => '雨',
            in_array($code, [71, 73, 75, 77, 85, 86], true) => '雪',
            in_array($code, [95, 96, 99], true) => '雷雨',
            default => '—',
        };
    }

    /** アイコン種別 → 日本語ラベル（手動登録用）。 */
    private function labelOfIcon(string $icon): string
    {
        return match ($icon) {
            'sunny' => '晴れ',
            'partly' => '晴れ時々曇り',
            'cloudy' => '曇り',
            'rain' => '雨',
            'snow' => '雪',
            'thunder' => '雷雨',
            default => '—',
        };
    }
}
