<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 貯金箱のビジュアル解禁に必要なポイントが不足している場合の例外。
 * ポイント・見た目要素は完全に任意のコスメティック機能であり、この例外はその解禁操作にのみ関わる
 * （記録・集計・レポート等の本来機能には一切影響しない）。
 */
class InsufficientPiggyBankPointsException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'ポイントが足りません。貯金箱にもっと貯まると解禁できます',
        ], 422);
    }
}
