import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 配色ポリシー: 赤字は使用しない。
 * - success: 達成・貯金（グリーン/ゴールド）
 * - caution: 予算超過・支払い超過などの気づきレベル（アンバー、警告色ではない）
 * - notice: 事前通知・リマインド（グレー）
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-brand-100 text-brand-700",
        success: "bg-gold-100 text-gold-700",
        caution: "bg-caution-100 text-caution-600",
        notice: "bg-notice-100 text-notice-500",
        outline: "border border-ink-200 text-ink-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
