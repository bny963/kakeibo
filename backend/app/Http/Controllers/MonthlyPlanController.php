<?php

namespace App\Http\Controllers;

use App\Http\Requests\MonthlyPlanRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlyPlanController extends Controller
{
    /**
     * 自分の指定月のプラン（手取り・固定費・貯金目標）のみ取得できる（権限設計 No.22）。
     * 存在しない場合はModelNotFoundExceptionによる404を返す（未設定月として扱う）。
     */
    public function show(Request $request, string $month): JsonResponse
    {
        $plan = $request->user()->monthlyPlans()->where('month', $month)->firstOrFail();

        return response()->json([
            ...$plan->toArray(),
            'weekly_allowance' => $plan->weeklyAllowance(),
        ]);
    }

    /** 自分の月次プランとして登録・更新できる（upsert）（権限設計 No.23）。 */
    public function store(MonthlyPlanRequest $request): JsonResponse
    {
        $plan = $request->user()->monthlyPlans()->updateOrCreate(
            ['month' => $request->validated('month')],
            [
                'income' => $request->validated('income'),
                'fixed_costs' => $request->validated('fixed_costs'),
                'savings_goal' => $request->validated('savings_goal'),
            ],
        );

        return response()->json([
            ...$plan->toArray(),
            'weekly_allowance' => $plan->weeklyAllowance(),
        ], 201);
    }
}
