/**
 * カテゴリ別グラフ用の配色。dataviz skillの検証済みカラーパレットから、
 * 「本アプリでは赤を一切使わない」という配色ポリシーに合わせて赤(slot 8)を除いた
 * 7色を採用（node scripts/validate_palette.jsで7色構成でも全チェックPASS済み）。
 * 8カテゴリ目以降は生成せず「その他」に畳み込む（dataviz skillの系列数ルール）。
 */
export const CATEGORICAL_PALETTE = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
] as const;

export function getCategoryColor(index: number): string {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
}

/**
 * 状態色（達成・警告など）。dataviz skillの既定status paletteはredを含むため、
 * 「損失回避に配慮し赤字・警告色を避ける」という本アプリの配色ポリシー
 * （index.cssのgold/cautionトークン）を優先し、赤は一切使わない。
 */
export const STATUS_COLOR = {
  good: "#22a67e", // brand-500
  caution: "#e08a1e", // caution-500
} as const;
