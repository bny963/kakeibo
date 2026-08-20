<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /** ログイン中ユーザー取得。 */
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * プロフィール設定（PG11）：名前・パスワード変更。
     * パスワードを変更する場合のみ現在のパスワードの確認を必須にする。
     */
    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->name = $request->validated('name');

        if ($request->filled('password')) {
            $user->password = $request->validated('password'); // hashedキャストにより自動でbcrypt化
        }

        $user->save();

        return response()->json($user);
    }
}
