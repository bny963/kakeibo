<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * budgets(user_id,category_id,month) の一意制約に同時リクエストで違反した場合の例外（例外設計 No.5）。
 * updateOrCreateの原子性はDB側のユニーク制約（トランザクション設計 No.5）で担保しているため、
 * 通常はこの例外は発生しないが、同時実行時のQueryExceptionをここに変換して中立的な文言で返す。
 */
class DuplicateBudgetException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => '既に設定済みです。再読み込みしてお試しください',
        ], 422);
    }
}
