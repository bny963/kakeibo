<?php

namespace App\Http\Controllers;

use App\Http\Requests\SummaryRequest;
use App\Models\Transaction;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class SummaryController extends Controller
{
    /**
     * 月次支出集計（権限設計 No.20）。
     * FN022（今月の収入・支出・残高サマリー）、FN023（前月比較の棒グラフ）、
     * FN025（直近12ヶ月の折れ線グラフ）に必要なデータをまとめて返す。
     */
    public function monthly(SummaryRequest $request): JsonResponse
    {
        $month = $request->resolvedMonth();
        $monthDate = CarbonImmutable::createFromFormat('Y-m', $month);
        $prevMonth = $monthDate->subMonthNoOverflow()->format('Y-m');

        $current = $this->totalsForMonth($request, $month);
        $previous = $this->totalsForMonth($request, $prevMonth);

        // 直近12ヶ月分（当月含む）を古い順に並べる（FN025）
        $trend = collect(range(11, 0))
            ->map(fn (int $i) => $monthDate->subMonthsNoOverflow($i)->format('Y-m'))
            ->map(fn (string $targetMonth) => [
                'month' => $targetMonth,
                ...$this->totalsForMonth($request, $targetMonth),
            ])
            ->values();

        return response()->json([
            'month' => $month,
            'income' => $current['income'],
            'expense' => $current['expense'],
            'balance' => $current['income'] - $current['expense'],
            'prev_month' => $prevMonth,
            'prev_income' => $previous['income'],
            'prev_expense' => $previous['expense'],
            'trend' => $trend,
        ]);
    }

    /**
     * カテゴリ別集計（権限設計 No.21）。FN024の円グラフ（ドーナツ型）用データ。
     */
    public function category(SummaryRequest $request): JsonResponse
    {
        $month = $request->resolvedMonth();
        $type = $request->validated('type') ?: 'expense';

        $rows = Transaction::query()
            ->where('user_id', $request->user()->id)
            ->where('type', $type)
            ->forMonth($month)
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->selectRaw('categories.id as category_id, categories.name, categories.color, categories.icon, SUM(transactions.amount) as total')
            ->groupBy('categories.id', 'categories.name', 'categories.color', 'categories.icon')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'month' => $month,
            'type' => $type,
            'categories' => $rows,
        ]);
    }

    /**
     * @return array{income: float, expense: float}
     */
    private function totalsForMonth(SummaryRequest $request, string $month): array
    {
        $sums = Transaction::query()
            ->where('user_id', $request->user()->id)
            ->forMonth($month)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        return [
            'income' => (float) ($sums['income'] ?? 0),
            'expense' => (float) ($sums['expense'] ?? 0),
        ];
    }
}
