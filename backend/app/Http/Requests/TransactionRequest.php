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
            'amount' => ['required', 'integer', 'min:1', 'max:9999999999'],
            // 未来日・過去日を無制限に登録できてしまう不具合の修正。
            // 収支の記録は「実際に起きたこと」を対象とするため未来日は不可、
            // 過去日も入力ミス防止のため直近20年に制限する。
            'date' => ['required', 'date', 'after_or_equal:'.now()->subYears(20)->toDateString(), 'before_or_equal:'.now()->toDateString()],
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
            'type.in' => '種別が正しくありません',
            'account_id.required' => '口座を選択してください',
            'account_id.exists' => '指定された口座が見つかりません',
            'category_id.required' => 'カテゴリを選択してください',
            'category_id.exists' => '指定されたカテゴリが見つかりません',
            'amount.required' => '金額を入力してください',
            'amount.integer' => '金額は整数で入力してください',
            'amount.min' => '1円以上の金額を入力してください',
            'amount.max' => '金額が大きすぎます',
            'date.required' => '日付を選択してください',
            'date.date' => '日付の形式が正しくありません',
            'date.after_or_equal' => '日付が古すぎます',
            'date.before_or_equal' => '未来の日付は登録できません',
            'note.max' => 'メモは200文字以内で入力してください',
        ];
    }
}
