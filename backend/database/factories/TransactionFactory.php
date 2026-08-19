<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        $type = fake()->randomElement(['income', 'expense']);

        return [
            'type' => $type,
            'amount' => $type === 'income'
                ? fake()->randomFloat(0, 30000, 300000)
                : fake()->randomFloat(0, 300, 15000),
            'date' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'note' => fake()->optional(0.4)->words(3, true),
            'is_recurring' => false,
        ];
    }
}
