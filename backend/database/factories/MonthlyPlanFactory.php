<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MonthlyPlan>
 */
class MonthlyPlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'month' => now()->format('Y-m'),
            'income' => 250000,
            'fixed_costs' => 90000,
            'savings_goal' => 20000,
        ];
    }
}
