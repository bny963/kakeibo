export type AccountType = "cash" | "bank" | "credit";
export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  category_id: number;
  type: TransactionType;
  amount: string;
  date: string;
  note: string | null;
  is_recurring: boolean;
  account?: Account;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Budget {
  id: number;
  category_id: number;
  amount: string;
  month: string;
  category?: Category;
  spent: number;
  usage_rate: number;
  status: "ok" | "near" | "over";
}

export interface RecurringRule {
  id: number;
  category_id: number;
  name: string;
  amount: string;
  day_of_month: number;
  next_date: string;
  category?: Category;
  is_reminder_due: boolean;
  is_overdue: boolean;
}

export interface MonthlyPlan {
  id: number;
  month: string;
  income: string;
  fixed_costs: string;
  savings_goal: string;
  weekly_allowance: number;
}

export interface PiggyBankWeekStatus {
  week_start_date: string;
  week_end_date: string;
  weekly_allowance: number;
  spent_amount: number;
  saved_amount: number;
  is_over_budget: boolean;
  has_plan: boolean;
}

export interface PiggyBankRecord {
  id: number;
  week_start_date: string;
  weekly_allowance: string;
  spent_amount: string;
  saved_amount: string;
}

export interface PiggyBankHistory {
  total_saved: number;
  weeks: PiggyBankRecord[];
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
  prev_month: string;
  prev_income: number;
  prev_expense: number;
  trend: { month: string; income: number; expense: number }[];
}

export interface CategorySummaryRow {
  category_id: number;
  name: string;
  color: string | null;
  icon: string | null;
  total: number;
}

export interface CategorySummary {
  month: string;
  type: CategoryType;
  categories: CategorySummaryRow[];
}
