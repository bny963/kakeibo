<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /** @var array<int, array{name: string, color: string, icon: string}> */
    public static array $expenseCategories = [
        ['name' => '食費', 'color' => '#22a67e', 'icon' => 'utensils'],
        ['name' => '交通費', 'color' => '#46c199', 'icon' => 'train'],
        ['name' => '家賃', 'color' => '#158567', 'icon' => 'home'],
        ['name' => '光熱費', 'color' => '#f5a521', 'icon' => 'zap'],
        ['name' => '通信費', 'color' => '#6f6d78', 'icon' => 'smartphone'],
        ['name' => '娯楽', 'color' => '#fbbf24', 'icon' => 'sparkles'],
        ['name' => '日用品', 'color' => '#8f8f9c', 'icon' => 'shopping-cart'],
        ['name' => '医療費', 'color' => '#e08a1e', 'icon' => 'heart-pulse'],
    ];

    /** @var array<int, array{name: string, color: string, icon: string}> */
    public static array $incomeCategories = [
        ['name' => '給与', 'color' => '#22a67e', 'icon' => 'wallet'],
        ['name' => '副業', 'color' => '#46c199', 'icon' => 'briefcase'],
    ];

    public function definition(): array
    {
        $type = fake()->randomElement(['income', 'expense']);
        $pool = $type === 'income' ? self::$incomeCategories : self::$expenseCategories;
        $picked = fake()->randomElement($pool);

        return [
            'name' => $picked['name'],
            'type' => $type,
            'color' => $picked['color'],
            'icon' => $picked['icon'],
        ];
    }

    public function expense(): static
    {
        return $this->state(fn () => [
            ...fake()->randomElement(self::$expenseCategories),
            'type' => 'expense',
        ]);
    }

    public function income(): static
    {
        return $this->state(fn () => [
            ...fake()->randomElement(self::$incomeCategories),
            'type' => 'income',
        ]);
    }
}
