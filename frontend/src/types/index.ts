export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currency: string;
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  dashboardWidgets?: Record<string, boolean>;
  profilePictureUrl: string | null;
}

export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';
export type PaymentMethodType = 'cash' | 'bank' | 'credit_card' | 'debit_card' | 'wallet' | 'other';

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  isArchived: boolean;
  isDefault: boolean;
  subcategories: Subcategory[];
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  isDefault: boolean;
  isArchived: boolean;
}

export interface Account {
  id: string;
  name: string;
  initialBalance: string;
  currency: string;
  isDefault: boolean;
  isArchived: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  categoryId: string;
  category?: Category;
  subcategoryId: string | null;
  subcategory?: Subcategory | null;
  date: string;
  paymentMethodId: string | null;
  paymentMethod?: PaymentMethod | null;
  accountId: string | null;
  account?: Account | null;
  notes: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlySaving: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  averageDailyExpense: number;
  averageMonthlyExpense: number;
  largestExpense: number;
  largestIncome: number;
}

export interface DashboardBalance {
  cashBalance: number;
  accounts: {
    accountId: string;
    name: string;
    balance: number;
  }[];
}
