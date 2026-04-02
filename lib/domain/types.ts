export type TransactionType = 'expense' | 'income';

export type CurrencyCode = 'EUR';

export type Transaction = {
  id: string;
  type: TransactionType;
  transactionDate: string;
  amount: number;
  description: string;
  categoryName: string;
  sourceSystem: 'google_sheets' | 'mock';
  sourceFileName?: string;
  sourceSheetName?: string;
  sourceRow?: number;
};

export type MonthlyBudget = {
  id: string;
  year: number;
  month: number;
  type: TransactionType;
  categoryName: string;
  plannedAmount: number;
};

export type Category = {
  id: string;
  type: TransactionType;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type TrendPoint = {
  date: string;
  income: number;
  expense: number;
  net: number;
  runningBalance: number;
};

export type CategoryTotal = {
  categoryName: string;
  amount: number;
  percentage: number;
};

export type BudgetInsight = {
  categoryName: string;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  usageRatio: number;
  status: 'under' | 'over' | 'balanced';
};

export type DashboardSummary = {
  monthLabel: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  savingsRate: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  trend: TrendPoint[];
  expenseCategories: CategoryTotal[];
  incomeCategories: CategoryTotal[];
  latestTransactions: Transaction[];
  budgetInsights: BudgetInsight[];
};


export type AnnualBalancePoint = {
  month: number;
  label: string;
  closingBalance: number;
  netAmount: number;
  income: number;
  expense: number;
};

export type AnnualAnalyticsData = {
  year: number;
  throughMonth: number;
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  savingsRate: number;
  expenseCategories: CategoryTotal[];
  incomeCategories: CategoryTotal[];
  topExpenseTransactions: Transaction[];
  topIncomeTransactions: Transaction[];
  months: AnnualBalancePoint[];
};
