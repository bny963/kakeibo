<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** 既に解禁済みのスキンを再度ポイントで解禁しようとした場合の例外（二重消費の防止）。 */
class PiggyBankSkinAlreadyUnlockedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'このビジュアルは既に解禁済みです',
        ], 422);
    }
}
