import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCategorySummary, useMonthlySummary } from "@/features/summary/api";
import { getCategoryColor } from "@/lib/chartPalette";
import { formatYen } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 収入/収支の2系列は「識別」の役割なので固定順のカテゴリカル配色を使う
// (loss-aversion配慮のため、支出側にamber/redなどの警告色は割り当てない)
const INCOME_COLOR = getCategoryColor(0); // blue
const EXPENSE_COLOR = getCategoryColor(1); // orange
const GRID_COLOR = "#e1e0d9";

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function ReportsPage() {
  const month = currentMonth();
  const { data: summary } = useMonthlySummary(month);
  const { data: categorySummary } = useCategorySummary(month, "expense");

  const monthlyBarData = React.useMemo(() => {
    if (!summary) return [];
    return [
      { label: "先月", 収入: summary.prev_income, 支出: summary.prev_expense },
      { label: "今月", 収入: summary.income, 支出: summary.expense },
    ];
  }, [summary]);

  const trendData = React.useMemo(
    () => summary?.trend.map((t) => ({ ...t, label: t.month.slice(5) + "月" })) ?? [],
    [summary],
  );

  const donutData = categorySummary?.categories ?? [];
  const donutTotal = donutData.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">レポート</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>月別収支（前月比較）</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBarData} barGap={4}>
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis dataKey="label" axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toLocaleString("ja-JP")}
                  width={64}
                />
                <Tooltip formatter={(value) => formatYen(Number(value))} />
                <Legend />
                <Bar dataKey="収入" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="支出" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別支出（今月）</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {donutTotal === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">
                今月の支出データがありません
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="total"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={entry.category_id} fill={entry.color ?? getCategoryColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatYen(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>年間推移（直近12ヶ月）</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="label" axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v.toLocaleString("ja-JP")}
                width={64}
              />
              <Tooltip formatter={(value) => formatYen(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="収入"
                stroke={INCOME_COLOR}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="支出"
                stroke={EXPENSE_COLOR}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
