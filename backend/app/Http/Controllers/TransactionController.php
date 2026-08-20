<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransactionIndexRequest;
use App\Http\Requests\TransactionRequest;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    /**
     * 自分が記録した取引一覧のみ取得できる（権限設計 No.15）。
     * 日付範囲・カテゴリ・種別でのフィルターと20件単位のページネーションに対応（FN018, FN021）。
     */
    public function index(TransactionIndexRequest $request): JsonResponse
    {
        $query = $this->filteredQuery($request)->orderByDesc('date')->orderByDesc('id');

        return response()->json($query->paginate(20));
    }

    /**
     * 期間・カテゴリを指定してCSVファイルをダウンロードできる（FN029 / テストケース一覧 No.9）。
     * indexと同じフィルター（日付範囲・カテゴリ・種別）を再利用する。
     */
    public function export(TransactionIndexRequest $request): StreamedResponse
    {
        $transactions = $this->filteredQuery($request)
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $filename = 'transactions_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            // Excelでの文字化けを防ぐためUTF-8 BOMを付与
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['日付', '種別', 'カテゴリ', '口座', '金額', 'メモ']);

            foreach ($transactions as $transaction) {
                fputcsv($handle, [
                    $transaction->date->toDateString(),
                    $transaction->type === 'income' ? '収入' : '支出',
                    $transaction->category->name,
                    $transaction->account->name,
                    (int) $transaction->amount,
                    $transaction->note,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /** 自分の取引として新規登録できる（権限設計 No.16）。account_id/category_idは自分の所有物のみ許可。 */
    public function store(TransactionRequest $request): JsonResponse
    {
        $transaction = $request->user()->transactions()->create([
            ...$request->validated(),
            'is_recurring' => false,
        ]);

        return response()->json($transaction->load(['account', 'category']), 201);
    }

    /** 自分の取引の詳細のみ取得できる。他人のIDを指定した場合は404（権限設計 No.17）。 */
    public function show(Request $request, int $id): JsonResponse
    {
        $transaction = $request->user()->transactions()->with(['account', 'category'])->findOrFail($id);

        return response()->json($transaction);
    }

    /** 自分の取引のみ編集できる。他人のIDを指定した場合は404（権限設計 No.18）。 */
    public function update(TransactionRequest $request, int $id): JsonResponse
    {
        $transaction = $request->user()->transactions()->findOrFail($id);
        $transaction->update($request->validated());

        return response()->json($transaction->load(['account', 'category']));
    }

    /** 自分の取引のみ削除できる。他人のIDを指定した場合は404（権限設計 No.19）。 */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $transaction = $request->user()->transactions()->findOrFail($id);
        $transaction->delete();

        return response()->json(null, 204);
    }

    private function filteredQuery(TransactionIndexRequest $request): HasMany
    {
        $filters = $request->validated();

        return $request->user()->transactions()
            ->with(['account', 'category'])
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->whereDate('date', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->whereDate('date', '<=', $to))
            ->when($filters['category_id'] ?? null, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->when($filters['type'] ?? null, fn ($q, $type) => $q->where('type', $type));
    }
}
