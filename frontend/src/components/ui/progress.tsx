import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  /** バーの色。使用率に応じて呼び出し側がグリーン/アンバーを切り替える（状態遷移設計参照）。 */
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => {
  // 予算超過時は使用率が100%を超えるため、バーの見た目・Radixへ渡す値ともに100%でクランプする
  const clampedValue = Math.min(value ?? 0, 100);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={clampedValue}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-ink-100", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full flex-1 bg-brand-500 transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - clampedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
