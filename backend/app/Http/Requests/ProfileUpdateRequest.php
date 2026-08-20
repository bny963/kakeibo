<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * PG11（プロフィール設定）「名前・パスワード変更」用。
 * 基本設計書のRoute/Controller一覧には明記がないが、画面設計・機能要件で
 * 要求されている画面のため、既存のCRUD群と同じFormRequestパターンで追加する。
 */
class ProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'current_password' => ['nullable', 'required_with:password', 'current_password'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'お名前を入力してください',
            'current_password.required_with' => '現在のパスワードを入力してください',
            'current_password.current_password' => '現在のパスワードが正しくありません',
            'password.min' => 'パスワードは8文字以上で入力してください',
            'password.confirmed' => '確認用パスワードが一致しません',
        ];
    }
}
