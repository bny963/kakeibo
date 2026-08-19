<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 紐づく取引が存在するカテゴリを削除しようとした場合の業務ルール違反（例外設計 No.4）。
 * トランザクション設計 No.4 の通り、確認(SELECT)と削除(DELETE)はDB::transaction()内で
 * 呼び出し側（CategoryController）がロックして行う。この例外はその結果を422として返す役割のみ担う。
 */
class CategoryInUseException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'このカテゴリには取引が紐づいているため削除できません。先に取引のカテゴリを変更してください',
        ], 422);
    }
}
