<?php

namespace App\Observers;

use App\Models\Account;
use App\Models\Transaction;

/**
 * 取引の登録・編集・削除に連動して口座残高を更新する。
 * 収入は加算、支出は減算。編集時は「更新前の効果を打ち消してから更新後の効果を反映する」ことで
 * 口座変更・種別変更・金額変更のいずれが起きても残高が正しく再計算されるようにする。
 */
class TransactionObserver
{
    public function created(Transaction $transaction): void
    {
        $this->applyDelta($transaction->account_id, $transaction->type, (float) $transaction->amount);
    }

    public function updating(Transaction $transaction): void
    {
        $original = $transaction->getOriginal();

        $this->applyDelta((int) $original['account_id'], (string) $original['type'], -(float) $original['amount']);
        $this->applyDelta($transaction->account_id, $transaction->type, (float) $transaction->amount);
    }

    public function deleted(Transaction $transaction): void
    {
        $this->applyDelta($transaction->account_id, $transaction->type, -(float) $transaction->amount);
    }

    private function applyDelta(int $accountId, string $type, float $amount): void
    {
        $signedAmount = $type === 'income' ? $amount : -$amount;

        Account::whereKey($accountId)->increment('balance', $signedAmount);
    }
}
