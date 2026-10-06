import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * 文字サイズはスマートフォンでは16px（text-base）、sm以上で14px（text-sm）。
 * iOS Safari は16px未満の入力欄にフォーカスすると画面を自動で拡大し、周辺の項目が見えなくなるため。
 * 利用者自身がピンチで拡大する操作は妨げない（viewport で user-scalable / maximum-scale は指定しない）。
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-base text-ink-900 placeholder:text-ink-400 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
