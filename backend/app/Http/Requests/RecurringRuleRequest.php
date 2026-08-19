<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecurringRuleRequest extends FormRequest
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
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('user_id', $this->user()?->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'integer', 'min:1'],
            'day_of_month' => ['required', 'integer', 'between:1,31'],
        ];
    }

    /**
     * エラーメッセージ設計 No.15 に準拠。
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category_id.required' => 'カテゴリを選択してください',
            'category_id.exists' => '指定されたカテゴリが見つかりません',
            'name.required' => '名称と金額を入力してください',
            'amount.required' => '名称と金額を入力してください',
            'amount.min' => '1円以上の金額を入力してください',
            'day_of_month.required' => '毎月の発生日を選択してください',
            'day_of_month.between' => '発生日は1〜31の範囲で指定してください',
        ];
    }
}
