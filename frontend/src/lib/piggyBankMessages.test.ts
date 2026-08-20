import { describe, expect, it } from "vitest";
import { buildExpenseResultMessage } from "@/lib/piggyBankMessages";
import type { PiggyBankWeekStatus } from "@/types/api";

const baseStatus: PiggyBankWeekStatus = {
  week_start_date: "2026-08-17",
  week_end_date: "2026-08-23",
  weekly_allowance: 32558.14,
  spent_amount: 5000,
  saved_amount: 27558.14,
  is_over_budget: false,
  has_plan: true,
};

/**
 * テストケース一覧 No.11・No.12: 支出登録後の結果メッセージは「-○○円」のような
 * 引き算表現ではなく、貯金箱に貯まった金額をプラスの文脈で表示する。
 */
describe("buildExpenseResultMessage", () => {
  it("shows the saved amount as a positive achievement when within budget", () => {
    const message = buildExpenseResultMessage(baseStatus);

    expect(message.variant).toBe("success");
    expect(message.title).toContain("貯まりました");
    expect(message.title).not.toContain("-");
  });

  it("never renders a negative saved amount, even when over budget", () => {
    const overBudget: PiggyBankWeekStatus = {
      ...baseStatus,
      spent_amount: 100000,
      saved_amount: 0,
      is_over_budget: true,
    };

    const message = buildExpenseResultMessage(overBudget);

    expect(message.variant).toBe("caution");
    expect(message.title).not.toContain("-");
    expect(message.title).not.toMatch(/円/); // 金額そのものを見せず、責めないトーンの文言に留める
  });
});
