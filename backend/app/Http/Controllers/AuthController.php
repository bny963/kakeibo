<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * 会員登録（FN001-FN005）。登録後は自動的にログイン状態にしてダッシュボードへ遷移できるようにする。
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            'name' => $request->string('name'),
            'email' => $request->string('email'),
            'password' => $request->string('password'), // hashedキャストにより自動でbcrypt化
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json($user, 201);
    }

    /**
     * ログイン（FN006-FN010）。Sanctum SPA Cookie認証。
     * 認証失敗時は「メール/パスワードのどちらが誤りか」を特定しない422を返す（権限設計 No.2）。
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['ログイン情報が登録されていません'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json($request->user());
    }

    /**
     * ログアウト（FN011）。セッション破棄・Cookie削除を行う。
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }

    /**
     * パスワードリセットメール送信。
     * メールアドレスの存在有無を推測されないよう、登録有無に関わらず常に成功レスポンスを返す（権限設計 No.5）。
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'パスワード再設定用のメールを送信しました（登録済みのメールアドレスの場合のみ届きます）',
        ]);
    }

    /**
     * パスワードリセット実行。トークンが無効・期限切れ（60分想定）の場合は422を返す。
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password, // hashedキャストにより自動でbcrypt化
                ])->setRememberToken(Str::random(60));

                $user->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['リセットリンクの有効期限が切れているか、無効です。もう一度お試しください'],
            ]);
        }

        return response()->json([
            'message' => 'パスワードを再設定しました。新しいパスワードでログインしてください',
        ]);
    }
}
