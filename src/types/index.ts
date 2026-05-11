// ============================================
// FinanceHub - Core Type Definitions
// ============================================

// Account Types
export type AccountType = 'Savings' | 'Current' | 'Salary' | 'NRI';

export interface Account {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  accountHolderName: string;
  nomineeName?: string;
  ifscCode?: string;
  branchName?: string;
  balance: number;
  currency: string;
  color: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
export type TransactionType = 'Income' | 'Expense' | 'Transfer';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  tags: string[];
  isRecurring: boolean;
  recurringId?: string;
  toAccountId?: string;
  notes?: string;
  runningBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  startDate: string;
  endDate?: string;
  nextDate: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'Income' | 'Expense' | 'Both';
  isDefault: boolean;
}

// Fixed Deposit Types
export type FDStatus = 'Active' | 'MaturingSoon' | 'Matured' | 'Closed';
export type CompoundingFrequency = 'Monthly' | 'Quarterly' | 'SemiAnnual' | 'Annual';
export type MaturityInstruction = 'AutoRenew' | 'Manual';

export interface FixedDeposit {
  id: string;
  fdId: string;
  bankName: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  maturityDate: string;
  compoundingFrequency: CompoundingFrequency;
  maturityInstruction: MaturityInstruction;
  linkedAccountId?: string;
  status: FDStatus;
  maturityAmount: number;
  interestEarned: number;
  tdsAmount: number;
  closedDate?: string;
  closureAmount?: number;
  isRenewed: boolean;
  previousFdId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FDInterestLog {
  id: string;
  fdId: string;
  interestAccruedToDate: number;
  calculationDate: string;
  maturityAmount: number;
  daysRemaining: number;
  createdAt: string;
}

// Investment Types
export type InvestmentType = 'Stock' | 'MutualFund' | 'Crypto' | 'Other';

export interface Investment {
  id: string;
  type: InvestmentType;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Insurance Types
export type InsuranceType = 'Life' | 'Health' | 'Vehicle' | 'Home' | 'Other';

export interface Insurance {
  id: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  sumInsured: number;
  premiumAmount: number;
  premiumFrequency: 'Monthly' | 'Quarterly' | 'Annual';
  startDate: string;
  renewalDate: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Budget Types
export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'Weekly' | 'Monthly' | 'Yearly';
  alertThreshold: number;
  spent: number;
  startDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Security Types
export interface SecuritySettings {
  appLockEnabled: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  biometricEnabled: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lockoutEndTime?: string;
}

// App Settings
export type ThemeMode = 'light' | 'dark' | 'system';
export type NumberFormat = 'indian' | 'international';

export interface AppSettings {
  theme: ThemeMode;
  currency: string;
  dateFormat: string;
  numberFormat: NumberFormat;
  notificationsEnabled: boolean;
  defaultAccountId?: string;
}

// Analytics Types
export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

// FD Calculation Types
export interface FDCalculationResult {
  maturityAmount: number;
  interestEarned: number;
  tdsAmount: number;
  netInterest: number;
  interestBreakdown: {
    period: string;
    interestAccrued: number;
    cumulativeInterest: number;
    balance: number;
  }[];
}

// Calculator Types
export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  schedule: {
    year: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
}

export interface SIPResult {
  totalInvestment: number;
  wealthGained: number;
  maturityAmount: number;
  yearlyBreakdown: {
    year: number;
    investment: number;
    value: number;
    returns: number;
  }[];
}

export interface CompoundInterestResult {
  maturityAmount: number;
  totalInterest: number;
  yearlyBreakdown: {
    year: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
}

export interface TaxResult {
  taxableIncome: number;
  taxBySlab: {
    slab: string;
    rate: number;
    amount: number;
  }[];
  totalTax: number;
  surcharge: number;
  cess: number;
  totalPayable: number;
}

// PDF Export Types
export interface PDFStatementConfig {
  accountId: string;
  startDate: string;
  endDate: string;
  includeRunningBalance: boolean;
  includeCategoryBreakdown: boolean;
  includeCharts: boolean;
}

// Notification Types
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Filter Types
export interface TransactionFilters {
  type?: TransactionType | 'All';
  category?: string;
  account?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tags?: string[];
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}
