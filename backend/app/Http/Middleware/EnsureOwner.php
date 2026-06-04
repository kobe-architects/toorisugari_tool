<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * オーナー(role=owner)のみ許可。管理API・PC分析の保護に使用。
 */
class EnsureOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user || $user->role !== 'owner') {
            abort(403, 'オーナー権限が必要です。');
        }

        return $next($request);
    }
}
