<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransactionIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 日付範囲・カテゴリ・種別（収入/支出）でのフィルターに対応（FN018）。
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'category_id' => ['nullable', 'integer'],
            'type' => ['nullable', Rule::in(['income', 'expense'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
