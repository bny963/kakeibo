<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicate_category_name_within_the_same_type_is_rejected(): void
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->expense()->create(['name' => '食費']);

        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name' => '食費',
            'type' => 'expense',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_same_name_is_allowed_across_income_and_expense(): void
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->expense()->create(['name' => 'その他']);

        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name' => 'その他',
            'type' => 'income',
        ]);

        $response->assertCreated();
    }
}
