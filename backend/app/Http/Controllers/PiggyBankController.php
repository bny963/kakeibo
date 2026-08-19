<?php

namespace App\Http\Controllers;

use App\Services\PiggyBankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PiggyBankController extends Controller
{
    public function __construct(private readonly PiggyBankService $piggyBankService)
    {
    }

    /**
     * 自分の貯金箱の累計額・週次履歴のみ取得できる（権限設計 No.24）。
     * 確定済みの週（状態遷移設計④）の一覧と、その累計金額を返す。
     */
    public function index(Request $request): JsonResponse
    {
        $records = $request->user()->piggyBankRecords()
            ->orderByDesc('week_start_date')
            ->get();

        return response()->json([
            // saved_amountは記録時点で0円未満にならないよう丸め済みのため単純合計でよい
            'total_saved' => (float) $records->sum('saved_amount'),
            'weeks' => $records,
        ]);
    }

    /**
     * 自分の今週の利用可能額・支出・貯金額のみ取得できる（権限設計 No.25）。
     * 「進行中の週」はDBに書き込まずリアルタイムに計算する（状態遷移設計④）。
     */
    public function thisWeek(Request $request): JsonResponse
    {
        return response()->json(
            $this->piggyBankService->computeWeekStatus($request->user())
        );
    }
}
