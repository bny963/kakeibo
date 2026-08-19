import { cn, formatYen } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: number;
  /** 前月比の差額。upGood=trueなら増加が好ましい(収入・残高)、falseなら減少が好ましい(支出)。 */
  delta?: number;
  upGood?: boolean;
}

/**
 * dataviz skillのStat tile契約（label / value / delta）に沿った単一値カード。
 * delta配色は「損失を強調しない」方針により、不利な方向でも赤は使わずグレーに留める。
 */
export function StatTile({ label, value, delta, upGood = true }: StatTileProps) {
  const isFavorable = delta === undefined ? null : upGood ? delta >= 0 : delta <= 0;

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-ink-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">{formatYen(value)}</p>
        {delta !== undefined && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              isFavorable ? "text-brand-600" : "text-ink-400",
            )}
          >
            前月比 {delta >= 0 ? "+" : ""}
            {formatYen(delta)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
