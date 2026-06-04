<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * レジ入店用のスタッフ一覧（ログイン画面のアバター選択に使用・公開）。
     */
    public function staff()
    {
        return User::query()
            ->where('is_active', true)
            ->orderByRaw("FIELD(role, 'owner', 'staff')")
            ->orderBy('id')
            ->get(['id', 'name', 'display_initial', 'role'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'initial' => $u->display_initial,
                'role' => $u->role,
            ]);
    }

    /**
     * スタッフPINで入店してトークンを発行。
     */
    public function pinLogin(Request $request)
    {
        $data = $request->validate([
            'staff_id' => ['required', 'integer', 'exists:users,id'],
            'pin' => ['required', 'string'],
        ]);

        $user = User::where('id', $data['staff_id'])->where('is_active', true)->first();

        if (! $user || ! $user->pin_hash || ! Hash::check($data['pin'], $user->pin_hash)) {
            throw ValidationException::withMessages([
                'pin' => 'PINが正しくありません。',
            ]);
        }

        $token = $user->createToken('pos-'.$user->id)->plainTextToken;

        return [
            'token' => $token,
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'initial' => $user->display_initial,
                'role' => $user->role,
            ],
        ];
    }

    /**
     * PC分析用：オーナーのメール＋パスワードログイン。
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->where('is_active', true)->first();

        if (! $user || ! $user->password || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'メールアドレスまたはパスワードが正しくありません。',
            ]);
        }
        if ($user->role !== 'owner') {
            throw ValidationException::withMessages([
                'email' => 'このアカウントには分析ツールへのアクセス権がありません。',
            ]);
        }

        $token = $user->createToken('pc-'.$user->id)->plainTextToken;

        return [
            'token' => $token,
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'initial' => $user->display_initial,
                'role' => $user->role,
            ],
        ];
    }

    /**
     * 現在のトークンを失効（ログアウト）。
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
