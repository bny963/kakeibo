<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BudgetIndexRequest extends FormRequest
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
            'month' => ['nullable', 'date_format:Y-m'],
        ];
    }

    public function resolvedMonth(): string
    {
        return $this->validated('month') ?: now()->format('Y-m');
    }
}
