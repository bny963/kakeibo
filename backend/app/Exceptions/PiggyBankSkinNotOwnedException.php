<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** 未解禁のスキンを装着しようとした場合の例外。 */
class PiggyBankSkinNotOwnedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'まだ解禁されていないビジュアルです',
        ], 422);
    }
}
