<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'amount',
        'day_of_month',
        'next_date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'day_of_month' => 'integer',
            'next_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * day_of_month（毎月何日）から次回発生日を計算する。
     * 当月の該当日を既に過ぎていれば翌月に繰り越す（月末日を超える場合は月末に丸める）。
     * FN034（登録時の自動計算）と状態遷移設計⑤（発生日超過後の次サイクルへの自動更新）で使用する。
     */
    public static function calculateNextDate(int $dayOfMonth, ?CarbonImmutable $from = null): CarbonImmutable
    {
        $today = ($from ?? CarbonImmutable::now())->startOfDay();
        $candidate = $today->day($dayOfMonth);

        if ($candidate->lessThan($today)) {
            $candidate = $candidate->addMonthNoOverflow();
        }

        return $candidate;
    }
}
