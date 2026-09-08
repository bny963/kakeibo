<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AccountRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('accounts', 'name')
                    ->where('user_id', $this->user()?->id)
                    ->ignore($this->route('id')),
            ],
            'type' => ['required', Rule::in(['cash', 'bank', 'credit'])],
            'balance' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => '口座名を入力してください',
            'name.max' => '口座名は100文字以内で入力してください',
            'name.unique' => 'この口座名は既に登録されています',
            'type.required' => '口座種別を選択してください',
            'type.in' => '口座種別が正しくありません',
            'balance.required' => '初期残高を入力してください',
            'balance.numeric' => '初期残高は数値で入力してください',
            'balance.min' => '初期残高は0円以上で入力してください',
            'balance.max' => '初期残高が大きすぎます',
        ];
    }
}
