<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecurringRuleRequest;
use App\Models\RecurringRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecurringRuleController extends Controller
{
    /**
     * 自分が登録した固定費・サブスク一覧を取得できる（権限設計 No.30）。
     * 次回発生日が3日以内に迫っているものにはリマインドフラグを付与する
     * （状態遷移設計⑤ / エラーメッセージ設計 No.16）。
     */
    public function index(Request $request): JsonResponse
    {
        $rules = $request->user()->recurringRules()
            ->with('category')
            ->orderBy('next_date')
            ->get();

        $today = now()->startOfDay();

        $result = $rules->map(function (RecurringRule $rule) use ($today) {
            // next_dateが未来ならプラス、過去ならマイナスになるよう符号を明示的に揃える
            $daysUntil = intdiv($rule->next_date->startOfDay()->timestamp - $today->timestamp, 86400);

            return [
                ...$rule->toArray(),
                'is_reminder_due' => $daysUntil <= 3 && $daysUntil >= 0,
                'is_overdue' => $daysUntil < 0,
            ];
        });

        return response()->json($result);
    }

    /**
     * 自分の固定費・サブスクとして新規登録できる（権限設計 No.31）。
     * next_dateは登録時にday_of_monthから自動計算する（FN034）。
     */
    public function store(RecurringRuleRequest $request): JsonResponse
    {
        $rule = $request->user()->recurringRules()->create([
            ...$request->validated(),
            'next_date' => RecurringRule::calculateNextDate($request->validated('day_of_month')),
        ]);

        return response()->json($rule->load('category'), 201);
    }

    /**
     * 自分の固定費・サブスクのみ更新できる。他人のIDを指定した場合は404（権限設計 No.32）。
     * day_of_monthが変わった場合はnext_dateを再計算する。
     */
    public function update(RecurringRuleRequest $request, int $id): JsonResponse
    {
        $rule = $request->user()->recurringRules()->findOrFail($id);

        $rule->update([
            ...$request->validated(),
            'next_date' => RecurringRule::calculateNextDate($request->validated('day_of_month')),
        ]);

        return response()->json($rule->load('category'));
    }

    /** 自分の固定費・サブスクのみ削除できる。他人のIDを指定した場合は404（権限設計 No.33）。 */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $rule = $request->user()->recurringRules()->findOrFail($id);
        $rule->delete();

        return response()->json(null, 204);
    }
}
