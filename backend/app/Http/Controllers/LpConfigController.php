<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

/**
 * 公式サイト（LP）の各セクション設定。
 *
 * 値は settings テーブルの 'lp_config' キーに JSON で保持する。
 * 画像は public ディスクの lp/ に保存し、config には表示用の絶対URLをそのまま格納する
 * （LPは別ドメインから参照するため相対URLでは解決できない）。
 * 未設定のテキストは DEFAULTS（現行LPの文言）を返し、画像は null（LP側の同梱画像を使用）。
 */
class LpConfigController extends Controller
{
    /** 現行LPの文言をそのまま既定値に。画像系は null（LP同梱画像を使用）。 */
    public const DEFAULTS = [
        'common' => [
            'logo' => null,
        ],
        'hero' => [
            'slides' => [],            // PC用スライド（空なら LP 同梱の3枚を使用）
            'slides_sp' => [],         // スマホ用スライド（空なら LP 同梱のSP画像を使用）
            'interval_sec' => 4.8,
            'title' => "休日のどこかで、\nふらっと出現する和紅茶。",
            'subtitle' => '― 茶農家さんのこだわりを、一杯に ―',
        ],
        'concept' => [
            'text' => "日本で育った茶葉には、その土地、その季節、\nその作り手だからこその表情がある。",
        ],
        'about' => [
            'image' => null,
            'heading' => '「とおりすがりの和紅茶」です。',
            'text' => "そんな和紅茶と、ふとした瞬間に出会える場所を作りたくて始めました。いつもそこにあるお店ではなく、イベントや出会った場所でだけ味わえる紅茶です。\n\n通りすがりに見つけた小さなきっかけが、少し特別な時間になれば嬉しいです。これから、出会った和紅茶や出店のお知らせを届けていきます。",
        ],
        'footer' => [
            'text' => "通りすがりに見つけた小さなきっかけが、\n少し特別な時間になりますように。",
        ],
    ];

    public const SECTIONS = ['common', 'hero', 'concept', 'about', 'footer'];

    /** LP設定の取得（公開・LPと管理画面が共用）。既定値にDBの上書きを重ねて返す。 */
    public function index()
    {
        $saved = Setting::get('lp_config', []);
        $out = [];
        foreach (self::DEFAULTS as $section => $defaults) {
            $out[$section] = array_merge($defaults, is_array($saved[$section] ?? null) ? $saved[$section] : []);
        }

        return $out;
    }

    /** 1セクション分の設定を更新（オーナーのみ）。他セクションには影響しない。 */
    public function update(Request $request)
    {
        $data = $request->validate([
            'section' => ['required', 'string', 'in:'.implode(',', self::SECTIONS)],
            'data' => ['required', 'array'],
            // 共通
            'data.logo' => ['nullable', 'string', 'max:2048'],
            // トップ
            'data.slides' => ['sometimes', 'array', 'max:12'],
            'data.slides.*' => ['string', 'max:2048'],
            'data.slides_sp' => ['sometimes', 'array', 'max:12'],
            'data.slides_sp.*' => ['string', 'max:2048'],
            'data.interval_sec' => ['sometimes', 'numeric', 'min:1', 'max:30'],
            'data.title' => ['sometimes', 'nullable', 'string', 'max:200'],
            'data.subtitle' => ['sometimes', 'nullable', 'string', 'max:200'],
            // コンセプト / フッター / about
            'data.text' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'data.image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'data.heading' => ['sometimes', 'nullable', 'string', 'max:200'],
        ]);

        $section = $data['section'];
        // 既定キーのみ受け入れて未知キーの混入を防ぐ。
        $incoming = Arr::only($data['data'], array_keys(self::DEFAULTS[$section]));

        $config = Setting::get('lp_config', []);
        if (! is_array($config)) {
            $config = [];
        }
        $config[$section] = array_merge($config[$section] ?? [], $incoming);
        Setting::put('lp_config', $config);

        return $this->index();
    }

    /** LP用画像のアップロード。表示用の絶対URLを返す（config にそのまま格納する）。 */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'], // 5MBまで
        ]);

        $path = $request->file('image')->store('lp', 'public');

        return [
            'url' => Storage::disk('public')->url($path),
        ];
    }
}
