import type { CSSProperties } from "react";

/**
 * 貯金箱の「柄」スキンをCSS背景として表現するためのユーティリティ。
 * 完全に装飾目的であり、メーターの状態色（green/gold/amber）には一切関わらない。
 */
export function patternBackgroundStyle(patternValue: string, colorValue: string): CSSProperties {
  const dotSize = "10px 10px";
  const stripeSize = "12px 12px";
  const starSize = "24px 24px";

  switch (patternValue) {
    case "dot":
      return {
        backgroundImage: `radial-gradient(${colorValue}33 35%, transparent 40%)`,
        backgroundSize: dotSize,
      };
    case "stripe":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${colorValue}26 0, ${colorValue}26 6px, transparent 6px, transparent ${stripeSize})`,
      };
    case "star":
      return {
        backgroundImage: `radial-gradient(${colorValue}40 15%, transparent 20%), radial-gradient(${colorValue}26 15%, transparent 20%)`,
        backgroundSize: `${starSize}, ${starSize}`,
        backgroundPosition: "0 0, 12px 12px",
      };
    default:
      return {};
  }
}
