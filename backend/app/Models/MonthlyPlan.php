<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyPlan extends Model
{
    use HasFactory;

    /** 1ヶ月 ≒ 4.3週（プロジェクト概要・機能要件 FN030 参照） */
    public const WEEKS_PER_MONTH = 4.3;

    protected $fillable = [
        'month',
        'income',
        'fixed_costs',
        'savings_goal',
    ];

    protected function casts(): array
    {
        return [
            'income' => 'decimal:2',
            'fixed_costs' => 'decimal:2',
            'savings_goal' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 1週間の利用可能額 = (手取り − 固定費 − 貯金目標) ÷ 4.3週。
     * マイナスにはならないよう0円を下限とする（テストケース一覧 No.10 参照）。
     */
    public function weeklyAllowance(): float
    {
        $remaining = (float) $this->income - (float) $this->fixed_costs - (float) $this->savings_goal;

        return round(max($remaining, 0) / self::WEEKS_PER_MONTH, 2);
    }
}
