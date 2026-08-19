import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="text-lg font-semibold text-ink-900">お探しのページが見つかりませんでした</p>
      <Link to="/dashboard" className="text-sm text-brand-600 underline">
        ダッシュボードへ戻る
      </Link>
    </div>
  );
}
