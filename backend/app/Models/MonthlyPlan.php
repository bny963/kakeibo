<?php

namespace App\Models;

use Carbon\CarbonInterface;
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

    /**
     * 指定した週（月曜始まり）の計算に使う月次プランの月（YYYY-MM）。
     *
     * 週の「木曜日」が属する月とする（ISO週番号と同じく、7日のうち4日以上を含む月）。
     * 以前は「週の開始日（月曜）が属する月」だったため、例えば 2026-10-01(木) に10月のプランを
     * 設定しても、その週（9/28〜10/4）は9月のプランを参照してしまい、案内どおりに設定しても
     * 使い始められなかった。設定画面もこの月を開くよう、APIで plan_month として返す。
     */
    public static function monthForWeek(CarbonInterface $weekStart): string
    {
        return $weekStart->toImmutable()->startOfWeek(CarbonInterface::MONDAY)->addDays(3)->format('Y-m');
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
