<?php

namespace App\Support;

/**
 * 貯金箱のビジュアル（色・柄・キャラクター）カタログ。
 *
 * これらはすべて見た目のみに影響するコスメティック要素であり、記録・集計・レポートなど
 * アプリ本来の機能を一切ロックしない。完全に任意で、無視して使い続けても支障はない。
 * 「赤字・警告色を使わない」「罪悪感を与えない」という既存の配色ポリシーとは別レイヤーのため、
 * ここでの色（ピンク/ミント/ラベンダー等）は貯金箱メーターの状態色（green/gold/amber）を
 * 置き換えるものではなく、アイコンやカード装飾にのみ使う。
 */
class PiggyBankSkinCatalog
{
    public const CATEGORY_COLOR = 'color';
    public const CATEGORY_PATTERN = 'pattern';
    public const CATEGORY_CHARACTER = 'character';

    /**
     * @return array<string, array{key: string, category: string, label: string, cost: int, value: string}>
     */
    public static function all(): array
    {
        return [
            // color: 貯金箱アイコン・カードの装飾色。進捗バーの状態色には使わない。
            'color_pink' => ['key' => 'color_pink', 'category' => self::CATEGORY_COLOR, 'label' => 'ピンク', 'cost' => 0, 'value' => '#f472b6'],
            'color_mint' => ['key' => 'color_mint', 'category' => self::CATEGORY_COLOR, 'label' => 'ミント', 'cost' => 80, 'value' => '#46c199'],
            'color_lavender' => ['key' => 'color_lavender', 'category' => self::CATEGORY_COLOR, 'label' => 'ラベンダー', 'cost' => 80, 'value' => '#a78bfa'],
            'color_sky' => ['key' => 'color_sky', 'category' => self::CATEGORY_COLOR, 'label' => 'スカイ', 'cost' => 80, 'value' => '#60a5fa'],
            'color_gold' => ['key' => 'color_gold', 'category' => self::CATEGORY_COLOR, 'label' => 'ゴールド', 'cost' => 150, 'value' => '#d98a0f'],

            // pattern: カード背景に重ねる装飾パターン。
            'pattern_none' => ['key' => 'pattern_none', 'category' => self::CATEGORY_PATTERN, 'label' => 'なし', 'cost' => 0, 'value' => 'none'],
            'pattern_dot' => ['key' => 'pattern_dot', 'category' => self::CATEGORY_PATTERN, 'label' => 'ドット', 'cost' => 60, 'value' => 'dot'],
            'pattern_stripe' => ['key' => 'pattern_stripe', 'category' => self::CATEGORY_PATTERN, 'label' => 'ストライプ', 'cost' => 60, 'value' => 'stripe'],
            'pattern_star' => ['key' => 'pattern_star', 'category' => self::CATEGORY_PATTERN, 'label' => 'スター', 'cost' => 120, 'value' => 'star'],

            // character: 貯金箱のマスコット（絵文字）。
            'character_pig' => ['key' => 'character_pig', 'category' => self::CATEGORY_CHARACTER, 'label' => 'ぶた', 'cost' => 0, 'value' => '🐷'],
            'character_cat' => ['key' => 'character_cat', 'category' => self::CATEGORY_CHARACTER, 'label' => 'ねこ', 'cost' => 150, 'value' => '🐱'],
            'character_rabbit' => ['key' => 'character_rabbit', 'category' => self::CATEGORY_CHARACTER, 'label' => 'うさぎ', 'cost' => 150, 'value' => '🐰'],
            'character_panda' => ['key' => 'character_panda', 'category' => self::CATEGORY_CHARACTER, 'label' => 'パンダ', 'cost' => 200, 'value' => '🐼'],
            'character_bear' => ['key' => 'character_bear', 'category' => self::CATEGORY_CHARACTER, 'label' => 'くま', 'cost' => 200, 'value' => '🐻'],
        ];
    }

    /** @return array<int, string> */
    public static function categories(): array
    {
        return [self::CATEGORY_COLOR, self::CATEGORY_PATTERN, self::CATEGORY_CHARACTER];
    }

    /** @return array{key: string, category: string, label: string, cost: int, value: string}|null */
    public static function find(string $key): ?array
    {
        return self::all()[$key] ?? null;
    }

    /** カテゴリごとの初期スキン（無料・常に解禁済み）のキー。 */
    public static function defaultKeyFor(string $category): string
    {
        return match ($category) {
            self::CATEGORY_COLOR => 'color_pink',
            self::CATEGORY_PATTERN => 'pattern_none',
            self::CATEGORY_CHARACTER => 'character_pig',
            default => throw new \InvalidArgumentException("Unknown category: {$category}"),
        };
    }
}
