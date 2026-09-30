import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FetchErrorNoticeProps {
  /** 何の取得に失敗したか（例: 「今月の集計」） */
  subject: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

/**
 * データの取得に失敗したことと、再試行の方法を示す。
 * 取得失敗を「0円」や「読み込み中」と表示すると、実際の結果（0円）や取得中と区別できないため、
 * 失敗時は必ずこの表示に切り替える。配色ポリシーに従い、赤ではなく控えめなアンバーを使う。
 */
export function FetchErrorNotice({ subject, onRetry, isRetrying = false }: FetchErrorNoticeProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-caution-200 bg-caution-50 px-4 py-3 text-sm text-caution-600"
    >
      <p>{subject}を取得できませんでした。通信状況を確認して、もう一度お試しください。</p>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
        <RefreshCw className="h-4 w-4" />
        {isRetrying ? "再試行中..." : "再試行"}
      </Button>
    </div>
  );
}
