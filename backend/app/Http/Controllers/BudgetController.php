<?php

namespace App\Http\Controllers;

use App\Http\Requests\BudgetIndexRequest;
use App\Http\Requests\BudgetRequest;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    /**
     * 自分が設定したカテゴリ別・月別予算一覧のみ取得できる（権限設計 No.26）。
     * FN027（使用率プログレスバー）・FN028（超過警告）のため、各予算に当月の使用額・使用率・
     * 状態（状態遷移設計③: 順調/まもなく到達/超過）を付与して返す。
     */
    public function index(BudgetIndexRequest $request): JsonResponse
    {
        $month = $request->resolvedMonth();

        $budgets = $request->user()->budgets()
            ->with('category')
            ->where('month', $month)
            ->orderBy('created_at')
            ->get();

        $spentByCategory = Transaction::query()
            ->where('user_id', $request->user()->id)
            ->where('type', 'expense')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$month])
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        $result = $budgets->map(function ($budget) use ($spentByCategory) {
            $spent = (float) ($spentByCategory[$budget->category_id] ?? 0);
            $amount = (float) $budget->amount;
            $usageRate = $amount > 0 ? round(min($spent / $amount, 1) * 100, 1) : 0;

            return [
                ...$budget->toArray(),
                'spent' => $spent,
                'usage_rate' => $usageRate,
                // 状態遷移設計③: 80%未満=順調(green) / 80%以上100%未満=まもなく到達(amber) / 100%以上=超過(amber)
                'status' => match (true) {
                    $spent >= $amount && $amount > 0 => 'over',
                    $usageRate >= 80 => 'near',
                    default => 'ok',
                },
            ];
        });

        return response()->json($result);
    }

    /**
     * カテゴリ・月を指定して予算金額を登録（既存があれば更新 = upsert）（権限設計 No.27）。
     */
    public function store(BudgetRequest $request): JsonResponse
    {
        $budget = $request->user()->budgets()->updateOrCreate(
            [
                'category_id' => $request->validated('category_id'),
                'month' => $request->validated('month'),
            ],
            [
                'amount' => $request->validated('amount'),
            ],
        );

        return response()->json($budget->load('category'), 201);
    }

    /** 自分の予算のみ金額を更新できる。他人のIDを指定した場合は404（権限設計 No.28）。 */
    public function update(BudgetRequest $request, int $id): JsonResponse
    {
        $budget = $request->user()->budgets()->findOrFail($id);
        $budget->update($request->validated());

        return response()->json($budget->load('category'));
    }

    /** 自分の予算のみ削除できる。他人のIDを指定した場合は404（権限設計 No.29）。 */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $budget = $request->user()->budgets()->findOrFail($id);
        $budget->delete();

        return response()->json(null, 204);
    }
}
