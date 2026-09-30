<?php

namespace App\Services;

use App\Models\MonthlyPlan;
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
     * 月をまたぐ週は「週の木曜日が属する月」の月次プランを基準にする（MonthlyPlan::monthForWeek）。
     *
     * @return array{week_start_date: string, week_end_date: string, weekly_allowance: float, spent_amount: float, saved_amount: float, is_over_budget: bool, has_plan: bool, plan_month: string}
     */
    public function computeWeekStatus(User $user, ?CarbonImmutable $weekStart = null): array
    {
        $weekStart = ($weekStart ?? CarbonImmutable::now())->startOfWeek(CarbonImmutable::MONDAY);
        $weekEnd = $weekStart->addDays(6);

        $planMonth = MonthlyPlan::monthForWeek($weekStart);
        $plan = $user->monthlyPlans()->where('month', $planMonth)->first();
        $weeklyAllowance = $plan?->weeklyAllowance() ?? 0.0;

        // 固定費として記録した支出（is_recurring）は、月次プランの「固定費」で既に差し引いているため数えない
        $spent = (float) $user->transactions()
            ->where('type', 'expense')
            ->where('is_recurring', false)
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
            'plan_month' => $planMonth,
        ];
    }

    /**
     * 完了済みの週（デフォルトは先週）をpiggy_bank_recordsへ確定として記録する。
     *
     * 既に確定済みの週は上書きせず、そのまま返す。確定後に取引を追加・訂正しても、家計簿の記録・
     * レポート・口座残高には反映されるが、貯金箱の確定額とポイントは変わらない。
     * - 記録が遅れたことでポイントが減る（記録するほど損をする）ことを避ける
     * - 使用済みのポイントが後から減って残高がマイナスになることを避ける
     * 以前はコメントでは「上書きしない」としつつ updateOrCreate で再計算していた。
     *
     * 進行中の週・未来の週は確定できない（貯まる前の金額でポイントが付与されてしまうため）。
     */
    public function finalizeWeek(User $user, ?CarbonImmutable $weekStart = null): PiggyBankRecord
    {
        $weekStart = ($weekStart ?? CarbonImmutable::now()->subWeek())->startOfWeek(CarbonImmutable::MONDAY);

        if ($weekStart->greaterThanOrEqualTo(CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY))) {
            throw new \InvalidArgumentException("進行中・未来の週は確定できません: {$weekStart->toDateString()}");
        }

        $existing = $user->piggyBankRecords()->whereDate('week_start_date', $weekStart->toDateString())->first();
        if ($existing !== null) {
            return $existing;
        }

        $status = $this->computeWeekStatus($user, $weekStart);

        return $user->piggyBankRecords()->create([
            'week_start_date' => $status['week_start_date'],
            'weekly_allowance' => $status['weekly_allowance'],
            'spent_amount' => $status['spent_amount'],
            'saved_amount' => $status['saved_amount'],
        ]);
    }
}
