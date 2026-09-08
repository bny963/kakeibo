<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
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
                Rule::unique('categories', 'name')
                    ->where('user_id', $this->user()?->id)
                    ->where('type', $this->input('type'))
                    ->ignore($this->route('id')),
            ],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'カテゴリ名を入力してください',
            'name.max' => 'カテゴリ名は100文字以内で入力してください',
            'name.unique' => 'この収支区分には同じ名前のカテゴリが既に登録されています',
            'type.required' => '収支区分を選択してください',
            'type.in' => '収支区分が正しくありません',
            'color.regex' => 'カラーコードは#RRGGBB形式で入力してください',
        ];
    }
}
