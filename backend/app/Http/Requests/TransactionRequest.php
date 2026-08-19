<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * account_id・category_id は自分が所有するものだけを許可する（権限設計 No.16）。
     * 他人のIDを指定した場合はexistsルールが失敗し422を返す。
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'type' => ['required', Rule::in(['income', 'expense'])],
            'account_id' => [
                'required',
                Rule::exists('accounts', 'id')->where('user_id', $userId),
            ],
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('user_id', $userId),
            ],
            'amount' => ['required', 'integer', 'min:1'],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:200'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.required' => '種別を選択してください',
            'account_id.required' => '口座を選択してください',
            'account_id.exists' => '指定された口座が見つかりません',
            'category_id.required' => 'カテゴリを選択してください',
            'category_id.exists' => '指定されたカテゴリが見つかりません',
            'amount.required' => '金額を入力してください',
            'amount.integer' => '金額は整数で入力してください',
            'amount.min' => '1円以上の金額を入力してください',
            'date.required' => '日付を選択してください',
            'date.date' => '日付の形式が正しくありません',
            'note.max' => 'メモは200文字以内で入力してください',
        ];
    }
}
