import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * 文字サイズは画面幅に関係なく常に16px（text-base）。
 * iOS Safari は16px未満の入力欄にフォーカスすると画面を自動で拡大し、周辺の項目が見えなくなるため。
 * 以前は sm（640px）以上で14pxにしていたが、横向きのiPhoneやiPadは640pxを超えるため自動拡大が残っていた。
 * 利用者自身がピンチで拡大する操作は妨げない（viewport で user-scalable / maximum-scale は指定しない）。
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-base text-ink-900 placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
