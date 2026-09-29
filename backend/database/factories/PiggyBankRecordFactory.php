<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PiggyBankRecord>
 */
class PiggyBankRecordFactory extends Factory
{
    public function definition(): array
    {
        return [
            'week_start_date' => now()->startOfWeek()->toDateString(),
            'weekly_allowance' => 30000,
            'spent_amount' => 20000,
            'saved_amount' => 10000,
        ];
    }
}
