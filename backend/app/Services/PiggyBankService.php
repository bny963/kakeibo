<?php

namespace App\Services;

use App\Models\PiggyBankRecord;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * 状態遷移設計④（週次プラン／貯金箱の週ステータス）のロジックを集約するサービス。
 * 「進行中の週」はこのクラスでリアルタイムに計算し（DB書き込みなし）、
 * 「確定済みの週」への遷移はConsole\Commands\FinalizePiggyBankWeekがこのクラスの計算結果を
 * piggy_bank_recordsへ書き込む（トランザクション設計 No.8）。
 */
class PiggyBankService
{
    /**
     * 指定週（デフォルトは今週）の利用可能額・支出・貯金額を計算する。
     * 月をまたぐ週は「週の開始日が属する月」の月次プランを基準にする。
     *
     * @return array{week_start_date: string, week_end_date: string, weekly_allowance: float, spent_amount: float, saved_amount: float, is_over_budget: bool, has_plan: bool}
     */
    public function computeWeekStatus(User $user, ?CarbonImmutable $weekStart = null): array
    {
        $weekStart = ($weekStart ?? CarbonImmutable::now())->startOfWeek(CarbonImmutable::MONDAY);
        $weekEnd = $weekStart->addDays(6);

        $plan = $user->monthlyPlans()->where('month', $weekStart->format('Y-m'))->first();
        $weeklyAllowance = $plan?->weeklyAllowance() ?? 0.0;

        $spent = (float) $user->transactions()
            ->where('type', 'expense')
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->sum('amount');

        $saved = max($weeklyAllowance - $spent, 0);

        return [
            'week_start_date' => $weekStart->toDateString(),
            'week_end_date' => $weekEnd->toDateString(),
            'weekly_allowance' => $weeklyAllowance,
            'spent_amount' => $spent,
            'saved_amount' => round($saved, 2),
            'is_over_budget' => $spent > $weeklyAllowance,
            'has_plan' => $plan !== null,
        ];
    }

    /**
     * 完了済みの週（デフォルトは先週）をpiggy_bank_recordsへ確定として記録する。
     * 既に確定済みの場合は上書きしない（week_start_dateの一意制約により重複作成は起きない）。
     */
    public function finalizeWeek(User $user, ?CarbonImmutable $weekStart = null): PiggyBankRecord
    {
        $weekStart = ($weekStart ?? CarbonImmutable::now()->subWeek())->startOfWeek(CarbonImmutable::MONDAY);
        $status = $this->computeWeekStatus($user, $weekStart);

        return $user->piggyBankRecords()->updateOrCreate(
            ['week_start_date' => $status['week_start_date']],
            [
                'weekly_allowance' => $status['weekly_allowance'],
                'spent_amount' => $status['spent_amount'],
                'saved_amount' => $status['saved_amount'],
            ],
        );
    }
}
