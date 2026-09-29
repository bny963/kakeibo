<?php

namespace App\Services;

use App\Exceptions\InsufficientPiggyBankPointsException;
use App\Exceptions\PiggyBankSkinAlreadyUnlockedException;
use App\Exceptions\PiggyBankSkinNotOwnedException;
use App\Models\PiggyBankSkinUnlock;
use App\Models\User;
use App\Support\PiggyBankSkinCatalog;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * 貯金箱のビジュアル（色・柄・キャラクター）をポイントで解禁・着せ替えするサービス。
 *
 * ポイントは「確定済みの週」（piggy_bank_records.saved_amount）の累計からのみ算出する。
 * 進行中の週の支出によってポイントが減ったり変動したりすることはなく、貯まる一方の設計になっている
 * （PiggyBankService::computeWeekStatus が進行中の週をDBに書き込まないのと同じ理由）。
 *
 * この機能はすべてコスメティック（見た目）要素であり、記録・集計・レポート等の本来機能を
 * 一切ロックしない。ユーザーが完全に無視しても、アプリの他の使い勝手には影響しない。
 */
class PiggyBankSkinService
{
    // 10円貯まるごとに1ポイント。
    private const YEN_PER_POINT = 10;

    public function totalEarnedPoints(User $user): int
    {
        $totalSaved = (float) $user->piggyBankRecords()->sum('saved_amount');

        return intdiv((int) floor($totalSaved), self::YEN_PER_POINT);
    }

    public function spentPoints(User $user): int
    {
        return (int) $user->piggyBankSkinUnlocks()->sum('points_spent');
    }

    public function pointsBalance(User $user): int
    {
        return $this->totalEarnedPoints($user) - $this->spentPoints($user);
    }

    /**
     * ユーザーが解禁済みのスキンキー一覧（コスト0円の初期スキンも常に含む）。
     *
     * @return array<int, string>
     */
    public function ownedSkinKeys(User $user): array
    {
        $owned = $user->piggyBankSkinUnlocks()->pluck('skin_key')->all();
        $defaults = array_map(
            fn (string $category) => PiggyBankSkinCatalog::defaultKeyFor($category),
            PiggyBankSkinCatalog::categories(),
        );

        return array_values(array_unique([...$defaults, ...$owned]));
    }

    /** 現在装着中のスキンキー（カテゴリ => キー）。未装着（=初期スキン）はデフォルトキーを返す。 */
    public function equippedAppearance(User $user): array
    {
        return [
            PiggyBankSkinCatalog::CATEGORY_COLOR => $user->piggy_bank_color
                ?? PiggyBankSkinCatalog::defaultKeyFor(PiggyBankSkinCatalog::CATEGORY_COLOR),
            PiggyBankSkinCatalog::CATEGORY_PATTERN => $user->piggy_bank_pattern
                ?? PiggyBankSkinCatalog::defaultKeyFor(PiggyBankSkinCatalog::CATEGORY_PATTERN),
            PiggyBankSkinCatalog::CATEGORY_CHARACTER => $user->piggy_bank_character
                ?? PiggyBankSkinCatalog::defaultKeyFor(PiggyBankSkinCatalog::CATEGORY_CHARACTER),
        ];
    }

    /** カタログ全体に解禁済み・装着中フラグを付与して返す。 */
    public function catalogFor(User $user): array
    {
        $owned = $this->ownedSkinKeys($user);
        $equipped = $this->equippedAppearance($user);

        return array_map(
            fn (array $skin) => [
                ...$skin,
                'owned' => in_array($skin['key'], $owned, true),
                'equipped' => ($equipped[$skin['category']] ?? null) === $skin['key'],
            ],
            PiggyBankSkinCatalog::all(),
        );
    }

    /**
     * 指定スキンをポイントで解禁する。
     * ユーザー行をロックした上で残高を再計算するため、同時リクエストによる二重解禁・
     * ポイントのマイナス残高は起きない（ユニーク制約(user_id,skin_key)によるDBレベルの担保もある）。
     */
    public function unlock(User $user, string $skinKey): PiggyBankSkinUnlock
    {
        $skin = PiggyBankSkinCatalog::find($skinKey);
        if ($skin === null) {
            throw new NotFoundHttpException();
        }

        return DB::transaction(function () use ($user, $skin) {
            $locked = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            if ($locked->piggyBankSkinUnlocks()->where('skin_key', $skin['key'])->exists()) {
                throw new PiggyBankSkinAlreadyUnlockedException();
            }

            if ($this->pointsBalance($locked) < $skin['cost']) {
                throw new InsufficientPiggyBankPointsException();
            }

            return $locked->piggyBankSkinUnlocks()->create([
                'skin_key' => $skin['key'],
                'points_spent' => $skin['cost'],
                'unlocked_at' => now(),
            ]);
        });
    }

    /** 解禁済みのスキンを装着する。カテゴリごとに同時に有効なのは1つのみ。 */
    public function equip(User $user, string $skinKey): void
    {
        $skin = PiggyBankSkinCatalog::find($skinKey);
        if ($skin === null) {
            throw new NotFoundHttpException();
        }

        if (! in_array($skin['key'], $this->ownedSkinKeys($user), true)) {
            throw new PiggyBankSkinNotOwnedException();
        }

        $column = match ($skin['category']) {
            PiggyBankSkinCatalog::CATEGORY_COLOR => 'piggy_bank_color',
            PiggyBankSkinCatalog::CATEGORY_PATTERN => 'piggy_bank_pattern',
            PiggyBankSkinCatalog::CATEGORY_CHARACTER => 'piggy_bank_character',
        };

        $user->update([$column => $skin['key']]);
    }
}
