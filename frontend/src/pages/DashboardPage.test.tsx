import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/pages/DashboardPage";
import { ToastProvider } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { MonthlySummary, PiggyBankSkin, PiggyBankSkinCatalog, PiggyBankWeekStatus } from "@/types/api";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const networkError = { isAxiosError: true, response: { status: 500, data: {} } };

const week: PiggyBankWeekStatus = {
  week_start_date: "2026-09-28",
  week_end_date: "2026-10-04",
  weekly_allowance: 32558.14,
  spent_amount: 5000,
  saved_amount: 27558.14,
  is_over_budget: false,
  has_plan: true,
  plan_month: "2026-10",
};

const zeroSummary: MonthlySummary = {
  month: "2026-10",
  income: 0,
  expense: 0,
  balance: 0,
  prev_month: "2026-09",
  prev_income: 0,
  prev_expense: 0,
  trend: [],
};

function skin(key: string, category: PiggyBankSkin["category"], value: string, equipped: boolean): PiggyBankSkin {
  return { key, category, label: key, cost: 0, value, owned: true, equipped } as PiggyBankSkin;
}

// 柄「なし」＋キャラクター表示（初期のぶた）＋色「ミント」を装着した状態
const skinCatalog: PiggyBankSkinCatalog = {
  points_balance: 120,
  skins: [
    skin("color_pink", "color", "#f472b6", false),
    skin("color_mint", "color", "#46c199", true),
    skin("pattern_none", "pattern", "none", true),
    skin("character_pig", "character", "🐷", true),
  ],
  appearance: { color: "color_mint", pattern: "pattern_none", character: "character_pig" },
} as PiggyBankSkinCatalog;

type Responses = Record<string, () => Promise<unknown>>;

function mockApi(overrides: Responses = {}) {
  const responses: Responses = {
    "/api/piggy-bank/this-week": async () => week,
    "/api/piggy-bank/skins": async () => skinCatalog,
    "/api/summary/monthly": async () => zeroSummary,
    "/api/monthly-plans/2026-10": async () => {
      throw { isAxiosError: true, response: { status: 404, data: {} } };
    },
    ...overrides,
  };
  vi.mocked(api.get).mockImplementation(async (url: string) => {
    const respond = responses[url];
    return { data: respond ? await respond() : [] };
  });
}

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.get).mockReset();
});

describe("DashboardPage: 取得中・取得失敗・0円の区別", () => {
  it("集計の取得中は0円ではなく「取得中」と表示する", async () => {
    mockApi({ "/api/summary/monthly": () => new Promise(() => {}) });
    renderDashboard();

    expect(await screen.findAllByText("取得中...")).toHaveLength(3);
    expect(screen.queryByText("0円")).not.toBeInTheDocument();
  });

  it("集計の取得に失敗したら0円ではなく失敗と表示し、再試行で取得し直せる", async () => {
    let fail = true;
    mockApi({
      "/api/summary/monthly": async () => {
        if (fail) throw networkError;
        return { ...zeroSummary, income: 250000 };
      },
    });
    renderDashboard();

    const alert = await screen.findByText(/今月の集計を取得できませんでした/);
    expect(screen.queryByText("0円")).not.toBeInTheDocument();

    fail = false;
    await userEvent.click(within(alert.closest("[role=alert]") as HTMLElement).getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("250,000円")).toBeInTheDocument();
    expect(screen.queryByText(/今月の集計を取得できませんでした/)).not.toBeInTheDocument();
  });

  it("取得できた結果が0円の場合だけ0円と表示する", async () => {
    mockApi();
    renderDashboard();

    await waitFor(() => expect(screen.getAllByText("0円")).toHaveLength(3));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("貯金箱の取得中は「取得中」、失敗時は失敗と再試行ボタンを表示する", async () => {
    let fail = true;
    mockApi({
      "/api/piggy-bank/this-week": async () => {
        if (fail) throw networkError;
        return week;
      },
    });
    renderDashboard();

    const alert = await screen.findByText(/今週の貯金箱を取得できませんでした/);
    expect(screen.queryByText(/読み込み中/)).not.toBeInTheDocument();

    fail = false;
    await userEvent.click(within(alert.closest("[role=alert]") as HTMLElement).getByRole("button", { name: "再試行" }));
    expect(await screen.findByText("27,558円")).toBeInTheDocument();
  });
});

describe("DashboardPage: プラン設定の導線", () => {
  it("10/1の週（9/28開始）は、計算に使う10月のプランを設定画面で開く", async () => {
    mockApi({ "/api/piggy-bank/this-week": async () => ({ ...week, has_plan: false }) });
    renderDashboard();

    await userEvent.click(await screen.findByRole("button", { name: "10月のプランを設定する" }));

    expect(await screen.findByText("10月のプランを設定")).toBeInTheDocument();
    expect(screen.getByLabelText("10月の手取り収入")).toBeInTheDocument();
    expect(vi.mocked(api.get)).toHaveBeenCalledWith("/api/monthly-plans/2026-10");
  });
});

describe("PiggyBankMeter: きせかえの色", () => {
  it("柄「なし」でキャラクター表示中でも、装着した色が見出しに反映される", async () => {
    mockApi();
    renderDashboard();

    const title = await screen.findByText("貯金箱");
    const header = title.closest("[style]") as HTMLElement;
    // jsdom は色を rgb() に正規化する。#46c199 = rgb(70, 193, 153)
    expect(header.style.borderTop).toContain("rgb(70, 193, 153)");
    expect(header.style.backgroundColor).toContain("70, 193, 153");
  });
});
