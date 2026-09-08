<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BudgetRequest extends FormRequest
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
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'month' => ['required', 'date_format:Y-m'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category_id.required' => 'カテゴリを選択してください',
            'category_id.exists' => '指定されたカテゴリが見つかりません',
            'amount.required' => '予算金額を入力してください',
            'amount.numeric' => '予算金額は数値で入力してください',
            'amount.min' => '予算金額は0円以上で入力してください',
            'amount.max' => '予算金額が大きすぎます',
            'month.required' => '対象月を選択してください',
            'month.date_format' => '対象月はYYYY-MM形式で指定してください',
        ];
    }
}
