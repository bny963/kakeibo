<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Account>
 */
class AccountFactory extends Factory
{
    public function definition(): array
    {
        $type = fake()->randomElement(['cash', 'bank', 'credit']);

        $namesByType = [
            'cash' => ['財布'],
            'bank' => ['普通預金', 'ゆうちょ銀行'],
            'credit' => ['メインカード', '楽天カード'],
        ];

        return [
            'name' => fake()->randomElement($namesByType[$type]),
            'type' => $type,
            'balance' => fake()->randomFloat(2, 0, 200000),
        ];
    }
}
