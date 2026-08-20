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
        return [
            'type' => fake()->randomElement(['income', 'expense']),
            // 'amount'はクロージャにして、create(['type' => ...])で上書きされた後の
            // 最終的なtype値を見て金額レンジを決める（呼び出し側でtypeを上書きしても
            // 内部でランダムに決めた別のtypeを元に金額が算出されてしまう不整合を防ぐ）
            'amount' => fn (array $attributes) => $attributes['type'] === 'income'
                ? fake()->randomFloat(0, 30000, 300000)
                : fake()->randomFloat(0, 300, 15000),
            'date' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'note' => fake()->optional(0.4)->words(3, true),
            'is_recurring' => false,
        ];
    }
}
