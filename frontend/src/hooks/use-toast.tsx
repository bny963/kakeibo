import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "caution" | "notice";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (item: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...item, id }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const variantClasses: Record<ToastVariant, string> = {
  default: "border-ink-200 bg-white text-ink-900",
  success: "border-gold-200 bg-gold-50 text-gold-700",
  caution: "border-caution-200 bg-caution-50 text-caution-600",
  notice: "border-notice-200 bg-notice-50 text-notice-500",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto rounded-xl border p-4 shadow-md",
            variantClasses[t.variant ?? "default"],
          )}
        >
          <button
            onClick={() => dismiss(t.id)}
            className="float-right text-xs text-ink-400 hover:text-ink-700"
            aria-label="閉じる"
          >
            ✕
          </button>
          <p className="text-sm font-semibold">{t.title}</p>
          {t.description && <p className="mt-1 text-sm opacity-90">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}
