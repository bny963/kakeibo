<?php

namespace App\Http\Controllers;

use App\Exceptions\CategoryInUseException;
use App\Http\Requests\CategoryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    /** 自分が作成したカテゴリ一覧のみ取得できる（権限設計 No.11）。 */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->categories()->orderBy('created_at')->get()
        );
    }

    /** 自分のカテゴリとして新規作成できる（権限設計 No.12）。 */
    public function store(CategoryRequest $request): JsonResponse
    {
        $category = $request->user()->categories()->create($request->validated());

        return response()->json($category, 201);
    }

    /** 自分のカテゴリのみ更新できる。他人のIDを指定した場合は404（権限設計 No.13）。 */
    public function update(CategoryRequest $request, int $id): JsonResponse
    {
        $category = $request->user()->categories()->findOrFail($id);
        $category->update($request->validated());

        return response()->json($category);
    }

    /**
     * 自分のカテゴリのみ削除できる。紐づく取引がある場合はCategoryInUseExceptionで
     * 削除を拒否する（エラーメッセージ設計 No.14 / 例外設計 No.4）。
     * 確認(SELECT)と削除(DELETE)の間の競合を避けるため、トランザクション設計 No.4 の通り
     * DB::transaction()内で悲観ロックを取ってから判定する。
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = $request->user()->categories()->findOrFail($id);

        DB::transaction(function () use ($category) {
            $inUse = $category->transactions()->lockForUpdate()->exists();

            if ($inUse) {
                throw new CategoryInUseException();
            }

            $category->delete();
        });

        return response()->json(null, 204);
    }
}
