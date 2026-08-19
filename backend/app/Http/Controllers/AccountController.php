<?php

namespace App\Http\Controllers;

use App\Http\Requests\AccountRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    /** 自分が作成した口座一覧のみ取得できる（権限設計 No.7）。 */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->accounts()->orderBy('created_at')->get()
        );
    }

    /** 自分の口座として新規作成できる（権限設計 No.8）。 */
    public function store(AccountRequest $request): JsonResponse
    {
        $account = $request->user()->accounts()->create($request->validated());

        return response()->json($account, 201);
    }

    /**
     * 自分の口座のみ更新できる。他人の口座IDを指定した場合は404（権限設計 No.9）。
     */
    public function update(AccountRequest $request, int $id): JsonResponse
    {
        $account = $request->user()->accounts()->findOrFail($id);
        $account->update($request->validated());

        return response()->json($account);
    }

    /**
     * 自分の口座のみ削除できる。他人の口座IDを指定した場合は404（権限設計 No.10）。
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $account = $request->user()->accounts()->findOrFail($id);

        // カテゴリと同様、紐づく取引がある口座は誤操作防止のため削除できないようにする
        if ($account->transactions()->exists()) {
            throw ValidationException::withMessages([
                'account' => ['この口座には取引が紐づいているため削除できません。先に取引の口座を変更してください'],
            ]);
        }

        $account->delete();

        return response()->json(null, 204);
    }
}
