import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-ink-900/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * 画面のうち実際に見えている範囲（Visual Viewport）の位置と高さ。
 *
 * iOS Safari はキーボードを表示してもレイアウト上の画面の高さ（100dvh / innerHeight）を変えず、
 * キーボードが画面下部に重なるだけになる。通常はページをスクロールして入力欄を見せるが、ダイアログ表示中は
 * ページのスクロールが止まっているため、ダイアログ下部の入力欄や保存ボタンがキーボードの裏に隠れてしまう。
 * 見えている範囲に合わせてダイアログを配置し、キーボードが開いたらフォーカス中の入力欄を見える位置へスクロールする。
 */
function useVisualViewportBox() {
  const [box, setBox] = React.useState<{ top: number; height: number } | null>(null);

  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let frame = 0;
    const update = () => {
      setBox({ top: viewport.offsetTop, height: viewport.height });
      cancelAnimationFrame(frame);
      // ダイアログの大きさが変わった後に、フォーカス中の入力欄が見える位置までダイアログ内をスクロールする
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.closest('[role="dialog"]') && active.matches("input, textarea")) {
          active.scrollIntoView({ block: "nearest" });
        }
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return box;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, style, ...props }, ref) => {
  const viewportBox = useVisualViewportBox();

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        // スマートフォンでは見えている範囲の上部に寄せ、高さを見えている範囲に収めて中身をスクロールできるようにする
        // （sm以上は見えている範囲の中央）。Visual Viewport 非対応のブラウザでは画面全体（100dvh）を基準にする。
        // scroll-pb は、フォーカスした入力欄が下部に固定した保存ボタン（DialogFooter）に隠れないようにするため。
        className={cn(
          "fixed left-1/2 top-[calc(var(--vv-top,0px)+1rem)] z-50 max-h-[calc(var(--vv-height,100dvh)-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-y-auto overscroll-contain scroll-pb-24 rounded-card border border-ink-100 bg-white p-6 shadow-lg focus:outline-none sm:top-[calc(var(--vv-top,0px)+var(--vv-height,100dvh)/2)] sm:-translate-y-1/2",
          className,
        )}
        style={
          viewportBox
            ? ({ "--vv-top": `${viewportBox.top}px`, "--vv-height": `${viewportBox.height}px`, ...style } as React.CSSProperties)
            : style
        }
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 focus:outline-none">
          <X className="h-4 w-4" />
          <span className="sr-only">閉じる</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-ink-900", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-ink-500", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/**
 * ダイアログ下部に固定し、中身をスクロールしても保存・キャンセルのボタンに常に手が届くようにする。
 * -bottom-6 は DialogContent の下余白（p-6）の分。bottom-0 だと余白の分だけ浮き、下に入力欄が透けて見える。
 */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sticky -bottom-6 -mx-6 -mb-6 mt-6 flex justify-end gap-2 border-t border-ink-100 bg-white px-6 py-4",
      className,
    )}
    {...props}
  />
);

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
