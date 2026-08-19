<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class MonthlyPlanRequest extends FormRequest
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
            'month' => ['required', 'date_format:Y-m'],
            'income' => ['required', 'numeric', 'min:0'],
            'fixed_costs' => ['required', 'numeric', 'min:0'],
            'savings_goal' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'month.required' => '対象月を選択してください',
            'month.date_format' => '対象月はYYYY-MM形式で指定してください',
            'income.required' => '手取り収入を入力してください',
            'fixed_costs.required' => '固定費を入力してください',
            'savings_goal.required' => '貯金目標額を入力してください',
        ];
    }

    /**
     * テストケース一覧 No.10: 貯金目標が手取りを超える場合／固定費+貯金目標が手取りを超える場合は
     * 1週間の利用可能額が0円未満にならないようバリデーションで弾く。
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $income = (float) $this->input('income', 0);
            $fixedCosts = (float) $this->input('fixed_costs', 0);
            $savingsGoal = (float) $this->input('savings_goal', 0);

            if ($savingsGoal > $income) {
                $validator->errors()->add('savings_goal', '貯金目標は手取り収入以下に設定してください');

                return;
            }

            if (($fixedCosts + $savingsGoal) > $income) {
                $validator->errors()->add(
                    'fixed_costs',
                    '固定費と貯金目標の合計が手取り収入を超えています。1週間の利用可能額が0円を下回らないよう見直してください',
                );
            }
        });
    }
}
