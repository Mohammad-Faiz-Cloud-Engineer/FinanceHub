// ============================================
// FinanceHub - Zustand Store
// ============================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Account,
  Transaction,
  RecurringTransaction,
  Category,
  FixedDeposit,
  Investment,
  Insurance,
  Budget,
  SecuritySettings,
  AppSettings,
  TransactionFilters,
  MonthlySummary,
  CategorySummary,
  AppNotification,
} from '@/types';
import {
  generateId,
  calculateFDMaturity,
  calculateFDInterestAccrued,
  processRecurringTransactions,
  generateFDId,
  generatePinSalt,
  getFDStatus,
  hashPin,
  isValidPin,
  verifyPinHash,
} from '@/services';

// ============================================
// Default Data
// ============================================
const defaultCategories: Category[] = [
  { id: 'cat_1', name: 'Salary', icon: 'Wallet', color: '#10B981', type: 'Income', isDefault: true },
  { id: 'cat_2', name: 'Freelance', icon: 'Laptop', color: '#6366F1', type: 'Income', isDefault: true },
  { id: 'cat_3', name: 'Investments', icon: 'TrendingUp', color: '#8B5CF6', type: 'Income', isDefault: true },
  { id: 'cat_4', name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#EF4444', type: 'Expense', isDefault: true },
  { id: 'cat_5', name: 'Transport', icon: 'Car', color: '#F59E0B', type: 'Expense', isDefault: true },
  { id: 'cat_6', name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899', type: 'Expense', isDefault: true },
  { id: 'cat_7', name: 'Utilities', icon: 'Zap', color: '#06B6D4', type: 'Expense', isDefault: true },
  { id: 'cat_8', name: 'Rent', icon: 'Home', color: '#F97316', type: 'Expense', isDefault: true },
  { id: 'cat_9', name: 'Healthcare', icon: 'Heart', color: '#EF4444', type: 'Expense', isDefault: true },
  { id: 'cat_10', name: 'Entertainment', icon: 'Film', color: '#8B5CF6', type: 'Expense', isDefault: true },
  { id: 'cat_11', name: 'Education', icon: 'BookOpen', color: '#3B82F6', type: 'Expense', isDefault: true },
  { id: 'cat_12', name: 'Travel', icon: 'Plane', color: '#14B8A6', type: 'Expense', isDefault: true },
  { id: 'cat_13', name: 'Insurance', icon: 'Shield', color: '#64748B', type: 'Expense', isDefault: true },
  { id: 'cat_14', name: 'Gifts', icon: 'Gift', color: '#EC4899', type: 'Expense', isDefault: true },
  { id: 'cat_15', name: 'EMI', icon: 'CreditCard', color: '#F59E0B', type: 'Expense', isDefault: true },
  { id: 'cat_16', name: 'Transfer', icon: 'ArrowLeftRight', color: '#6B7280', type: 'Both', isDefault: true },
];

const defaultSettings: AppSettings = {
  theme: 'system',
  currency: '₹',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'indian',
  notificationsEnabled: true,
};

const defaultSecurity: SecuritySettings = {
  appLockEnabled: false,
  pinHash: null,
  pinSalt: null,
  biometricEnabled: false,
  isLocked: false,
  failedAttempts: 0,
};

const MAX_TEXT_LENGTH = 120;
const MAX_NOTE_LENGTH = 1000;
const MAX_TAGS = 20;
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_FAILED_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 5;

function nowIso(): string {
  return new Date().toISOString();
}

function cleanText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanOptionalText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | undefined {
  const cleaned = cleanText(value, maxLength);
  return cleaned || undefined;
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toPositiveNumber(value: unknown, fallback = 0): number {
  return Math.max(0, toFiniteNumber(value, fallback));
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function cleanDate(value: unknown, fallback = new Date().toISOString().split('T')[0]): string {
  return isDateString(value) ? value : fallback;
}

function isTransactionType(value: unknown): value is Transaction['type'] {
  return value === 'Income' || value === 'Expense' || value === 'Transfer';
}

function isAccountType(value: unknown): value is Account['accountType'] {
  return value === 'Savings' || value === 'Current' || value === 'Salary' || value === 'NRI';
}

function isFDCompounding(value: unknown): value is FixedDeposit['compoundingFrequency'] {
  return value === 'Monthly' || value === 'Quarterly' || value === 'SemiAnnual' || value === 'Annual';
}

function isFDMaturityInstruction(value: unknown): value is FixedDeposit['maturityInstruction'] {
  return value === 'AutoRenew' || value === 'Manual';
}

function isInvestmentType(value: unknown): value is Investment['type'] {
  return value === 'Stock' || value === 'MutualFund' || value === 'Crypto' || value === 'Other';
}

function isInsuranceType(value: unknown): value is Insurance['type'] {
  return value === 'Life' || value === 'Health' || value === 'Vehicle' || value === 'Home' || value === 'Other';
}

function isPremiumFrequency(value: unknown): value is Insurance['premiumFrequency'] {
  return value === 'Monthly' || value === 'Quarterly' || value === 'Annual';
}

function isBudgetPeriod(value: unknown): value is Budget['period'] {
  return value === 'Weekly' || value === 'Monthly' || value === 'Yearly';
}

function cleanTags(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((tag) => cleanText(tag, 32)).filter(Boolean).slice(0, MAX_TAGS)
    : [];
}

function transactionDelta(tx: Transaction): Record<string, number> {
  if (tx.type === 'Income') return { [tx.accountId]: tx.amount };
  if (tx.type === 'Expense') return { [tx.accountId]: -tx.amount };
  if (!tx.toAccountId || tx.toAccountId === tx.accountId) return {};
  return { [tx.accountId]: -tx.amount, [tx.toAccountId]: tx.amount };
}

function applyTransactionDelta(accounts: Account[], tx: Transaction, direction: 1 | -1): Account[] {
  const delta = transactionDelta(tx);
  const updatedAt = nowIso();
  return accounts.map((account) => {
    const change = delta[account.id];
    return change ? { ...account, balance: account.balance + change * direction, updatedAt } : account;
  });
}

function recalculateRunningBalances(transactions: Transaction[], accountIds: string[]): Transaction[] {
  const accountIdSet = new Set(accountIds);
  const balances = new Map<string, number>();
  const runningByTransaction = new Map<string, number>();

  [...transactions]
    .filter((tx) => accountIdSet.has(tx.accountId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((tx) => {
      const current = balances.get(tx.accountId) ?? 0;
      const delta = tx.type === 'Income' ? tx.amount : -tx.amount;
      const next = Math.round((current + delta) * 100) / 100;
      balances.set(tx.accountId, next);
      runningByTransaction.set(tx.id, next);
    });

  return transactions.map((tx) =>
    accountIdSet.has(tx.accountId)
      ? { ...tx, runningBalance: runningByTransaction.get(tx.id) ?? tx.runningBalance }
      : tx
  );
}

function validateTransactionInput(
  tx: Omit<Transaction, 'id' | 'runningBalance' | 'createdAt' | 'updatedAt'>,
  accounts: Account[]
): Omit<Transaction, 'id' | 'runningBalance' | 'createdAt' | 'updatedAt'> | null {
  const amount = toPositiveNumber(tx.amount);
  const accountExists = accounts.some((account) => account.id === tx.accountId);
  const transferTargetExists = tx.toAccountId
    ? accounts.some((account) => account.id === tx.toAccountId)
    : false;

  if (!accountExists || amount <= 0 || !isTransactionType(tx.type)) return null;
  if (tx.type === 'Transfer' && (!tx.toAccountId || !transferTargetExists || tx.toAccountId === tx.accountId)) return null;

  return {
    accountId: tx.accountId,
    type: tx.type,
    amount,
    description: cleanText(tx.description),
    category: cleanText(tx.category),
    date: cleanDate(tx.date),
    tags: cleanTags(tx.tags),
    isRecurring: Boolean(tx.isRecurring),
    recurringId: cleanOptionalText(tx.recurringId),
    toAccountId: tx.type === 'Transfer' ? tx.toAccountId : undefined,
    notes: cleanOptionalText(tx.notes, MAX_NOTE_LENGTH),
  };
}

function sanitizeSecurity(value: Partial<SecuritySettings> | undefined): SecuritySettings {
  return {
    ...defaultSecurity,
    appLockEnabled: Boolean(value?.appLockEnabled && value.pinHash && value.pinSalt),
    pinHash: cleanOptionalText(value?.pinHash, 128) ?? null,
    pinSalt: cleanOptionalText(value?.pinSalt, 64) ?? null,
    biometricEnabled: Boolean(value?.biometricEnabled),
    isLocked: Boolean(value?.appLockEnabled && value.pinHash && value.pinSalt),
    failedAttempts: 0,
    lockoutEndTime: undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeAccountRecord(value: unknown): Account | null {
  if (!isRecord(value)) return null;
  const bankName = cleanText(value.bankName);
  const accountNumber = cleanText(value.accountNumber, 34);
  const accountHolderName = cleanText(value.accountHolderName);
  if (!bankName || !accountNumber || !accountHolderName || !isAccountType(value.accountType)) return null;
  return {
    id: cleanText(value.id, 80) || generateId(),
    bankName,
    accountNumber,
    accountType: value.accountType,
    accountHolderName,
    nomineeName: cleanOptionalText(value.nomineeName),
    ifscCode: cleanOptionalText(cleanText(value.ifscCode, 11).toUpperCase(), 11),
    branchName: cleanOptionalText(value.branchName),
    balance: toFiniteNumber(value.balance),
    currency: cleanText(value.currency, 8) || 'INR',
    color: cleanText(value.color, 24) || '#0F766E',
    isPrimary: Boolean(value.isPrimary),
    createdAt: cleanText(value.createdAt, 40) || nowIso(),
    updatedAt: cleanText(value.updatedAt, 40) || nowIso(),
  };
}

function sanitizeCategoryRecord(value: unknown): Category | null {
  if (!isRecord(value)) return null;
  const name = cleanText(value.name);
  if (!name || (value.type !== 'Income' && value.type !== 'Expense' && value.type !== 'Both')) return null;
  return {
    id: cleanText(value.id, 80) || generateId(),
    name,
    icon: cleanText(value.icon, 48) || 'Circle',
    color: cleanText(value.color, 24) || '#6B7280',
    type: value.type,
    isDefault: Boolean(value.isDefault),
  };
}

function sanitizeTransactionRecord(value: unknown, accounts: Account[]): Transaction | null {
  if (!isRecord(value)) return null;
  const base = validateTransactionInput(
    {
      accountId: cleanText(value.accountId, 80),
      type: value.type,
      amount: toPositiveNumber(value.amount),
      description: cleanText(value.description),
      category: cleanText(value.category),
      date: cleanDate(value.date),
      tags: cleanTags(value.tags),
      isRecurring: Boolean(value.isRecurring),
      recurringId: cleanOptionalText(value.recurringId),
      toAccountId: cleanOptionalText(value.toAccountId, 80),
      notes: cleanOptionalText(value.notes, MAX_NOTE_LENGTH),
    } as Omit<Transaction, 'id' | 'runningBalance' | 'createdAt' | 'updatedAt'>,
    accounts
  );
  if (!base || !base.description || !base.category) return null;
  return {
    ...base,
    id: cleanText(value.id, 80) || generateId(),
    runningBalance: toFiniteNumber(value.runningBalance),
    createdAt: cleanText(value.createdAt, 40) || nowIso(),
    updatedAt: cleanText(value.updatedAt, 40) || nowIso(),
  };
}

function sanitizeRecurringRecord(value: unknown, accounts: Account[]): RecurringTransaction | null {
  if (!isRecord(value)) return null;
  const accountId = cleanText(value.accountId, 80);
  const amount = toPositiveNumber(value.amount);
  if (!accounts.some((account) => account.id === accountId) || amount <= 0 || !isTransactionType(value.type)) return null;
  if (value.frequency !== 'Daily' && value.frequency !== 'Weekly' && value.frequency !== 'Monthly' && value.frequency !== 'Yearly') return null;
  return {
    id: cleanText(value.id, 80) || generateId(),
    accountId,
    type: value.type,
    amount,
    description: cleanText(value.description),
    category: cleanText(value.category),
    frequency: value.frequency,
    startDate: cleanDate(value.startDate),
    endDate: isDateString(value.endDate) ? value.endDate : undefined,
    nextDate: cleanDate(value.nextDate),
    tags: cleanTags(value.tags),
    isActive: Boolean(value.isActive),
    createdAt: cleanText(value.createdAt, 40) || nowIso(),
  };
}

function sanitizeFixedDepositRecord(value: unknown): FixedDeposit | null {
  if (!isRecord(value) || !isFDCompounding(value.compoundingFrequency)) return null;
  const principal = toPositiveNumber(value.principal);
  const interestRate = toPositiveNumber(value.interestRate);
  const tenureMonths = Math.max(1, Math.min(1200, Math.round(toPositiveNumber(value.tenureMonths))));
  const bankName = cleanText(value.bankName);
  if (!bankName || principal <= 0) return null;
  const startDate = cleanDate(value.startDate);
  const maturityDate = cleanDate(value.maturityDate);
  const calc = calculateFDMaturity(principal, interestRate, tenureMonths, value.compoundingFrequency);
  const fd: FixedDeposit = {
    id: cleanText(value.id, 80) || generateId(),
    fdId: cleanText(value.fdId, 32) || generateFDId(),
    bankName,
    principal,
    interestRate,
    tenureMonths,
    startDate,
    maturityDate,
    compoundingFrequency: value.compoundingFrequency,
    maturityInstruction: isFDMaturityInstruction(value.maturityInstruction) ? value.maturityInstruction : 'Manual',
    linkedAccountId: cleanOptionalText(value.linkedAccountId, 80),
    status: value.status === 'Closed' ? 'Closed' : 'Active',
    maturityAmount: calc.maturityAmount,
    interestEarned: calc.interestEarned,
    tdsAmount: calc.tdsAmount,
    closedDate: isDateString(value.closedDate) ? value.closedDate : undefined,
    closureAmount: value.closureAmount === undefined ? undefined : toPositiveNumber(value.closureAmount),
    isRenewed: Boolean(value.isRenewed),
    previousFdId: cleanOptionalText(value.previousFdId, 80),
    createdAt: cleanText(value.createdAt, 40) || nowIso(),
    updatedAt: cleanText(value.updatedAt, 40) || nowIso(),
  };
  return { ...fd, status: getFDStatus(fd) };
}

function sanitizeInvestmentRecord(value: unknown): Investment | null {
  if (!isRecord(value) || !isInvestmentType(value.type)) return null;
  const symbol = cleanText(value.symbol, 24).toUpperCase();
  const name = cleanText(value.name);
  const quantity = toPositiveNumber(value.quantity);
  const purchasePrice = toPositiveNumber(value.purchasePrice);
  if (!symbol || !name || quantity <= 0 || purchasePrice <= 0) return null;
  return {
    id: cleanText(value.id, 80) || generateId(),
    type: value.type,
    symbol,
    name,
    quantity,
    purchasePrice,
    currentPrice: toPositiveNumber(value.currentPrice),
    purchaseDate: isDateString(value.purchaseDate) ? value.purchaseDate : '',
    notes: cleanOptionalText(value.notes, MAX_NOTE_LENGTH),
    createdAt: cleanText(value.createdAt, 40) || nowIso(),
    updatedAt: cleanText(value.updatedAt, 40) || nowIso(),
  };
}

function sanitizeInsuranceRecord(value: unknown): Insurance | null {
  if (!isRecord(value) || !isInsuranceType(value.type) || !isPremiumFrequency(value.premiumFrequency)) return null;
  const provider = cleanText(value.provider);
  const policyNumber = cleanText(value.policyNumber, 64);
  const premiumAmount = toPositiveNumber(value.premiumAmount);
  if (!provider || !policyNumber || premiumAmount <= 0) return null;
  return {
    id: cleanText(value.id, 80) || generateId(),
    type: value.type,
    provider,
    policyNumber,
    sumInsured: toPositiveNumber(value.sumInsured),
    premiumAmount,
    premiumFrequency: value.premiumFrequency,
    startDate: isDateString(value.startDate) ? value.startDate : '',
    renewalDate: cleanDate(value.renewalDate),
    notes: cleanOptionalText(value.notes, MAX_NOTE_LENGTH),
    isActive: Boolean(value.isActive),
    createdAt: cleanText(value.createdAt, 40) || nowIso(),
    updatedAt: cleanText(value.updatedAt, 40) || nowIso(),
  };
}

function sanitizeBudgetRecord(value: unknown, categories: Category[]): Budget | null {
  if (!isRecord(value) || !isBudgetPeriod(value.period)) return null;
  const categoryId = cleanText(value.categoryId, 80);
  const amount = toPositiveNumber(value.amount);
  if (!categories.some((category) => category.id === categoryId) || amount <= 0) return null;
  return {
    id: cleanText(value.id, 80) || generateId(),
    categoryId,
    amount,
    period: value.period,
    alertThreshold: Math.min(100, Math.max(1, Math.round(toPositiveNumber(value.alertThreshold, 90)))),
    spent: toPositiveNumber(value.spent),
    startDate: cleanDate(value.startDate),
    isActive: Boolean(value.isActive),
    createdAt: cleanText(value.createdAt, 40) || nowIso(),
    updatedAt: cleanText(value.updatedAt, 40) || nowIso(),
  };
}

// ============================================
// Store State Interface
// ============================================
interface FinanceStore {
  // Data
  accounts: Account[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  categories: Category[];
  fixedDeposits: FixedDeposit[];
  investments: Investment[];
  insurance: Insurance[];
  budgets: Budget[];
  notifications: AppNotification[];
  settings: AppSettings;
  security: SecuritySettings;
  isDataLoaded: boolean;

  // UI State
  activeModal: string | null;
  modalData: unknown;
  selectedAccountId: string | null;
  selectedTransactionId: string | null;
  selectedFDId: string | null;
  transactionFilters: TransactionFilters;
  currentRoute: string;

  // Computed (implemented as methods)
  getAccountById: (id: string) => Account | undefined;
  getAccountBalance: (id: string) => number;
  getTotalBalance: () => number;
  getNetWorth: () => number;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getFilteredTransactions: () => Transaction[];
  getMonthlySummary: (months?: number) => MonthlySummary[];
  getCategorySummary: (type: 'Income' | 'Expense', month?: string) => CategorySummary[];
  getActiveFDs: () => FixedDeposit[];
  getFDsByStatus: (status: string) => FixedDeposit[];
  getTotalPortfolioValue: () => number;
  getInvestmentPnL: () => { total: number; percentage: number };
  getBudgetUtilization: () => (Budget & { utilization: number; status: string })[];
  getUnreadNotifications: () => AppNotification[];

  // Actions - Accounts
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setPrimaryAccount: (id: string) => void;

  // Actions - Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'runningBalance' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setTransactionFilters: (filters: Partial<TransactionFilters>) => void;

  // Actions - Recurring
  addRecurringTransaction: (tx: Omit<RecurringTransaction, 'id' | 'nextDate' | 'createdAt'>) => void;
  updateRecurringTransaction: (id: string, data: Partial<RecurringTransaction>) => void;
  deleteRecurringTransaction: (id: string) => void;
  processRecurring: () => void;

  // Actions - Categories
  addCategory: (cat: Omit<Category, 'id' | 'isDefault'>) => void;

  // Actions - Fixed Deposits
  addFixedDeposit: (fd: Omit<FixedDeposit, 'id' | 'fdId' | 'maturityAmount' | 'interestEarned' | 'tdsAmount' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateFixedDeposit: (id: string, data: Partial<FixedDeposit>) => void;
  closeFixedDeposit: (id: string, closureDate: string, closureAmount: number) => void;
  renewFixedDeposit: (id: string, newData: Partial<FixedDeposit>) => void;
  getFDInterestAccrued: (id: string) => number;

  // Actions - Investments
  addInvestment: (inv: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvestment: (id: string, data: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  updateStockPrice: (id: string, currentPrice: number) => void;

  // Actions - Insurance
  addInsurance: (ins: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInsurance: (id: string, data: Partial<Insurance>) => void;
  deleteInsurance: (id: string) => void;
  renewInsurance: (id: string, newRenewalDate: string) => void;

  // Actions - Budgets
  addBudget: (budget: Omit<Budget, 'id' | 'spent' | 'createdAt' | 'updatedAt'>) => void;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  recalculateBudgetSpent: () => void;

  // Actions - Notifications
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateSecurity: (security: Partial<SecuritySettings>) => void;
  setSecurityPin: (pin: string) => Promise<boolean>;
  clearSecurityPin: () => void;
  setAppLocked: (locked: boolean) => void;
  verifyPin: (pin: string) => Promise<boolean>;

  // Actions - UI
  setActiveModal: (modal: string | null, data?: unknown) => void;
  setSelectedAccount: (id: string | null) => void;
  setSelectedTransaction: (id: string | null) => void;
  setSelectedFD: (id: string | null) => void;
  setCurrentRoute: (route: string) => void;

  // Data Management
  initializeData: () => void;
  resetAllData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

// ============================================
// Store Implementation
// ============================================
export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      // ========================================
      // Initial State
      // ========================================
      accounts: [],
      transactions: [],
      recurringTransactions: [],
      categories: defaultCategories,
      fixedDeposits: [],
      investments: [],
      insurance: [],
      budgets: [],
      notifications: [],
      settings: defaultSettings,
      security: defaultSecurity,
      isDataLoaded: false,

      activeModal: null,
      modalData: null,
      selectedAccountId: null,
      selectedTransactionId: null,
      selectedFDId: null,
      transactionFilters: { type: 'All' },
      currentRoute: '/',

      // ========================================
      // Computed Methods
      // ========================================
      getAccountById: (id: string) => {
        return get().accounts.find((a) => a.id === id);
      },

      getAccountBalance: (id: string) => {
        const account = get().accounts.find((a) => a.id === id);
        return account?.balance ?? 0;
      },

      getTotalBalance: () => {
        return get().accounts.reduce((sum, a) => sum + a.balance, 0);
      },

      getNetWorth: () => {
        const cashBalance = get().accounts.reduce((sum, a) => sum + a.balance, 0);
        const investmentValue = get().investments.reduce(
          (sum, i) => sum + i.currentPrice * i.quantity,
          0
        );
        const fdValue = get().fixedDeposits
          .filter((fd) => fd.status === 'Active' || fd.status === 'MaturingSoon')
          .reduce((sum, fd) => {
            const accrued = calculateFDInterestAccrued(fd);
            return sum + fd.principal + accrued;
          }, 0);
        return cashBalance + investmentValue + fdValue;
      },

      getTransactionsByAccount: (accountId: string) => {
        return get().transactions
          .filter((t) => t.accountId === accountId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getFilteredTransactions: () => {
        let txs = [...get().transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const filters = get().transactionFilters;

        if (filters.type && filters.type !== 'All') {
          txs = txs.filter((t) => t.type === filters.type);
        }
        if (filters.category) {
          txs = txs.filter((t) => t.category === filters.category);
        }
        if (filters.account) {
          txs = txs.filter((t) => t.accountId === filters.account);
        }
        if (filters.dateFrom) {
          txs = txs.filter((t) => t.date >= filters.dateFrom!);
        }
        if (filters.dateTo) {
          txs = txs.filter((t) => t.date <= filters.dateTo!);
        }
        if (filters.search) {
          const q = filters.search.toLowerCase();
          txs = txs.filter(
            (t) =>
              t.description.toLowerCase().includes(q) ||
              t.category.toLowerCase().includes(q) ||
              t.tags.some((tag) => tag.toLowerCase().includes(q))
          );
        }

        return txs;
      },

      getMonthlySummary: (months = 6) => {
        const txs = get().transactions;
        const summaries: MonthlySummary[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const monthTxs = txs.filter((t) => t.date.startsWith(monthKey));

          const income = monthTxs
            .filter((t) => t.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);
          const expense = monthTxs
            .filter((t) => t.type === 'Expense')
            .reduce((sum, t) => sum + t.amount, 0);
          const savings = income - expense;
          const savingsRate = income > 0 ? (savings / income) * 100 : 0;

          summaries.push({
            month: monthKey,
            income,
            expense,
            savings,
            savingsRate: Math.round(savingsRate * 100) / 100,
          });
        }

        return summaries;
      },

      getCategorySummary: (type: 'Income' | 'Expense', month?: string) => {
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const txs = get().transactions.filter(
          (t) => t.type === type && t.date.startsWith(targetMonth)
        );
        const categories = get().categories;
        const summaryMap = new Map<string, CategorySummary>();

        txs.forEach((tx) => {
          const cat = categories.find((c) => c.name === tx.category);
          const existing = summaryMap.get(tx.category);
          if (existing) {
            existing.amount += tx.amount;
            existing.transactionCount += 1;
          } else {
            summaryMap.set(tx.category, {
              categoryId: cat?.id || '',
              categoryName: tx.category,
              categoryColor: cat?.color || '#6B7280',
              amount: tx.amount,
              percentage: 0,
              transactionCount: 1,
            });
          }
        });

        const result = Array.from(summaryMap.values());
        const total = result.reduce((s, r) => s + r.amount, 0);
        result.forEach((r) => {
          r.percentage = total > 0 ? Math.round((r.amount / total) * 1000) / 10 : 0;
        });

        return result.sort((a, b) => b.amount - a.amount);
      },

      getActiveFDs: () => {
        return get().fixedDeposits.filter(
          (fd) => fd.status === 'Active' || fd.status === 'MaturingSoon'
        );
      },

      getFDsByStatus: (status: string) => {
        return get().fixedDeposits.filter((fd) => fd.status === status);
      },

      getTotalPortfolioValue: () => {
        return get().investments.reduce(
          (sum, i) => sum + i.currentPrice * i.quantity,
          0
        );
      },

      getInvestmentPnL: () => {
        const investments = get().investments;
        const totalInvested = investments.reduce(
          (sum, i) => sum + i.purchasePrice * i.quantity,
          0
        );
        const currentValue = investments.reduce(
          (sum, i) => sum + i.currentPrice * i.quantity,
          0
        );
        const total = currentValue - totalInvested;
        const percentage = totalInvested > 0 ? (total / totalInvested) * 100 : 0;
        return { total: Math.round(total * 100) / 100, percentage: Math.round(percentage * 100) / 100 };
      },

      getBudgetUtilization: () => {
        const budgets = get().budgets;

        return budgets.map((budget) => {
          const utilization = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
          let status = 'safe';
          if (utilization >= 100) status = 'over';
          else if (utilization >= budget.alertThreshold) status = 'warning';
          else if (utilization >= 70) status = 'caution';

          return { ...budget, utilization: Math.round(utilization * 10) / 10, status };
        });
      },

      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.isRead);
      },

      // ========================================
      // Account Actions
      // ========================================
      addAccount: (account) => {
        const bankName = cleanText(account.bankName);
        const accountNumber = cleanText(account.accountNumber, 34);
        const accountHolderName = cleanText(account.accountHolderName);
        if (!bankName || !accountNumber || !accountHolderName || !isAccountType(account.accountType)) return;

        const newAccount: Account = {
          ...account,
          bankName,
          accountNumber,
          accountHolderName,
          nomineeName: cleanOptionalText(account.nomineeName),
          ifscCode: cleanOptionalText(account.ifscCode?.toUpperCase(), 11),
          branchName: cleanOptionalText(account.branchName),
          balance: toFiniteNumber(account.balance),
          id: generateId(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((state) => ({ accounts: [...state.accounts, newAccount] }));
      },

      updateAccount: (id, data) => {
        const sanitized = withoutUndefined({
          ...data,
          bankName: data.bankName === undefined ? undefined : cleanText(data.bankName),
          accountNumber: data.accountNumber === undefined ? undefined : cleanText(data.accountNumber, 34),
          accountHolderName: data.accountHolderName === undefined ? undefined : cleanText(data.accountHolderName),
          nomineeName: data.nomineeName === undefined ? undefined : cleanOptionalText(data.nomineeName),
          ifscCode: data.ifscCode === undefined ? undefined : cleanOptionalText(data.ifscCode.toUpperCase(), 11),
          branchName: data.branchName === undefined ? undefined : cleanOptionalText(data.branchName),
          balance: data.balance === undefined ? undefined : toFiniteNumber(data.balance),
        });
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...sanitized, updatedAt: nowIso() } : a
          ),
        }));
      },

      deleteAccount: (id) => {
        set((state) => {
          const removedTransactions = state.transactions.filter(
            (t) => t.accountId === id || t.toAccountId === id
          );
          const adjustedAccounts = removedTransactions.reduce(
            (accounts, tx) => applyTransactionDelta(accounts, tx, -1),
            state.accounts
          );

          return {
            accounts: adjustedAccounts.filter((a) => a.id !== id),
            transactions: state.transactions.filter(
              (t) => t.accountId !== id && t.toAccountId !== id
            ),
          };
        });
      },

      setPrimaryAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.map((a) => ({
            ...a,
            isPrimary: a.id === id,
            updatedAt: new Date().toISOString(),
          })),
        }));
      },

      // ========================================
      // Transaction Actions
      // ========================================
      addTransaction: (tx) => {
        set((state) => {
          const validated = validateTransactionInput(tx, state.accounts);
          if (!validated || !validated.description || !validated.category) return {};

          const newTx: Transaction = {
            ...validated,
            id: generateId(),
            runningBalance: 0,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
          const newTransactions = recalculateRunningBalances(
            [...state.transactions, newTx],
            [newTx.accountId]
          );
          return {
            accounts: applyTransactionDelta(state.accounts, newTx, 1),
            transactions: newTransactions,
          };
        });
      },

      updateTransaction: (id, data) => {
        set((state) => {
          const existing = state.transactions.find((t) => t.id === id);
          if (!existing) return {};

          const candidate = {
            ...existing,
            ...data,
            tags: data.tags ?? existing.tags,
            isRecurring: data.isRecurring ?? existing.isRecurring,
          };
          const validated = validateTransactionInput(candidate, state.accounts);
          if (!validated || !validated.description || !validated.category) return {};

          const updatedTx: Transaction = {
            ...existing,
            ...validated,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: nowIso(),
          };
          const replacedTransactions = state.transactions.map((t) => (t.id === id ? updatedTx : t));
          const affectedAccountIds = Array.from(new Set([existing.accountId, updatedTx.accountId]));

          return {
            accounts: applyTransactionDelta(
              applyTransactionDelta(state.accounts, existing, -1),
              updatedTx,
              1
            ),
            transactions: recalculateRunningBalances(replacedTransactions, affectedAccountIds),
          };
        });
      },

      deleteTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          if (!tx) return {};
          const remainingTransactions = state.transactions.filter((t) => t.id !== id);
          return {
            transactions: recalculateRunningBalances(remainingTransactions, [tx.accountId]),
            accounts: applyTransactionDelta(state.accounts, tx, -1),
          };
        });
      },

      setTransactionFilters: (filters) => {
        set((state) => ({
          transactionFilters: { ...state.transactionFilters, ...filters },
        }));
      },

      // ========================================
      // Recurring Transaction Actions
      // ========================================
      addRecurringTransaction: (tx) => {
        const newTx: RecurringTransaction = {
          ...tx,
          id: generateId(),
          nextDate: tx.startDate,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          recurringTransactions: [...state.recurringTransactions, newTx],
        }));
      },

      updateRecurringTransaction: (id, data) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }));
      },

      deleteRecurringTransaction: (id) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter((t) => t.id !== id),
        }));
      },

      processRecurring: () => {
        const state = get();
        const processed = processRecurringTransactions(state.recurringTransactions);

        processed.forEach((p) => {
          state.addTransaction(p.transaction);
          state.updateRecurringTransaction(p.recurringId, { nextDate: p.nextDate });
        });
      },

      // ========================================
      // Category Actions
      // ========================================
      addCategory: (cat) => {
        const name = cleanText(cat.name);
        if (!name || (cat.type !== 'Income' && cat.type !== 'Expense' && cat.type !== 'Both')) return;
        const newCat: Category = {
          ...cat,
          name,
          icon: cleanText(cat.icon, 48) || 'Circle',
          color: cleanText(cat.color, 24) || '#6B7280',
          id: generateId(),
          isDefault: false,
        };
        set((state) => ({ categories: [...state.categories, newCat] }));
      },

      // ========================================
      // Fixed Deposit Actions
      // ========================================
      addFixedDeposit: (fd) => {
        const principal = toPositiveNumber(fd.principal);
        const interestRate = toPositiveNumber(fd.interestRate);
        const tenureMonths = Math.max(1, Math.min(1200, Math.round(toPositiveNumber(fd.tenureMonths))));
        const startDate = cleanDate(fd.startDate);
        if (!cleanText(fd.bankName) || principal <= 0 || interestRate < 0 || !isFDCompounding(fd.compoundingFrequency)) return;

        const maturityDate = new Date(startDate);
        maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);
        const calc = calculateFDMaturity(principal, interestRate, tenureMonths, fd.compoundingFrequency);
        const daysToMaturity = Math.ceil((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const status: FixedDeposit['status'] =
          daysToMaturity <= 0 ? 'Matured' : daysToMaturity <= 30 ? 'MaturingSoon' : 'Active';

        const newFD: FixedDeposit = {
          ...fd,
          bankName: cleanText(fd.bankName),
          principal,
          interestRate,
          tenureMonths,
          startDate,
          maturityDate: maturityDate.toISOString().split('T')[0],
          maturityInstruction: isFDMaturityInstruction(fd.maturityInstruction) ? fd.maturityInstruction : 'Manual',
          id: generateId(),
          fdId: generateFDId(),
          maturityAmount: calc.maturityAmount,
          interestEarned: calc.interestEarned,
          tdsAmount: calc.tdsAmount,
          status,
          isRenewed: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((state) => ({ fixedDeposits: [...state.fixedDeposits, newFD] }));
      },

      updateFixedDeposit: (id, data) => {
        set((state) => {
          const fds = state.fixedDeposits.map((fd) => {
            if (fd.id !== id) return fd;
            const updated = {
              ...fd,
              ...withoutUndefined({
                ...data,
                bankName: data.bankName === undefined ? undefined : cleanText(data.bankName),
                principal: data.principal === undefined ? undefined : toPositiveNumber(data.principal),
                interestRate: data.interestRate === undefined ? undefined : toPositiveNumber(data.interestRate),
                tenureMonths: data.tenureMonths === undefined ? undefined : Math.max(1, Math.min(1200, Math.round(toPositiveNumber(data.tenureMonths)))),
                startDate: data.startDate === undefined ? undefined : cleanDate(data.startDate),
              }),
              updatedAt: nowIso(),
            };
            if (data.principal !== undefined || data.interestRate !== undefined || data.tenureMonths !== undefined || data.compoundingFrequency !== undefined || data.startDate !== undefined) {
              const calc = calculateFDMaturity(
                updated.principal,
                updated.interestRate,
                updated.tenureMonths,
                updated.compoundingFrequency
              );
              updated.maturityAmount = calc.maturityAmount;
              updated.interestEarned = calc.interestEarned;
              updated.tdsAmount = calc.tdsAmount;

              const maturityDate = new Date(updated.startDate);
              maturityDate.setMonth(maturityDate.getMonth() + updated.tenureMonths);
              updated.maturityDate = maturityDate.toISOString().split('T')[0];
            }
            return updated;
          });
          return { fixedDeposits: fds };
        });
      },

      closeFixedDeposit: (id, closureDate, closureAmount) => {
        set((state) => ({
          fixedDeposits: state.fixedDeposits.map((fd) =>
            fd.id === id
              ? {
                  ...fd,
            status: 'Closed' as const,
                  closedDate: cleanDate(closureDate),
                  closureAmount: toPositiveNumber(closureAmount),
                  updatedAt: nowIso(),
                }
              : fd
          ),
        }));
      },

      renewFixedDeposit: (id, newData) => {
        const state = get();
        const oldFD = state.fixedDeposits.find((fd) => fd.id === id);
        if (!oldFD) return;

        const principal = toPositiveNumber(newData.principal ?? oldFD.principal);
        const interestRate = toPositiveNumber(newData.interestRate ?? oldFD.interestRate);
        const tenureMonths = Math.max(1, Math.min(1200, Math.round(toPositiveNumber(newData.tenureMonths ?? oldFD.tenureMonths))));
        const compoundingFrequency = isFDCompounding(newData.compoundingFrequency) ? newData.compoundingFrequency : oldFD.compoundingFrequency;
        const calc = calculateFDMaturity(principal, interestRate, tenureMonths, compoundingFrequency);

        const startDate = cleanDate(newData.startDate);
        const maturityDate = new Date(startDate);
        maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

        const renewedFD: FixedDeposit = {
          ...oldFD,
          ...newData,
          id: generateId(),
          fdId: generateFDId(),
          principal,
          interestRate,
          tenureMonths,
          startDate,
          maturityDate: maturityDate.toISOString().split('T')[0],
          compoundingFrequency,
          maturityInstruction: isFDMaturityInstruction(newData.maturityInstruction) ? newData.maturityInstruction : oldFD.maturityInstruction,
          maturityAmount: calc.maturityAmount,
          interestEarned: calc.interestEarned,
          tdsAmount: calc.tdsAmount,
          status: 'Active',
          isRenewed: true,
          previousFdId: oldFD.id,
          closedDate: undefined,
          closureAmount: undefined,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        set((state) => ({
          fixedDeposits: [
            ...state.fixedDeposits.map((fd) =>
              fd.id === id ? { ...fd, status: 'Closed' as const, updatedAt: nowIso() } : fd
            ),
            renewedFD,
          ],
        }));
      },

      getFDInterestAccrued: (id: string) => {
        const fd = get().fixedDeposits.find((f) => f.id === id);
        if (!fd || fd.status === 'Closed') return 0;
        return calculateFDInterestAccrued(fd);
      },

      // ========================================
      // Investment Actions
      // ========================================
      addInvestment: (inv) => {
        const quantity = toPositiveNumber(inv.quantity);
        const purchasePrice = toPositiveNumber(inv.purchasePrice);
        const currentPrice = toPositiveNumber(inv.currentPrice);
        const symbol = cleanText(inv.symbol, 24).toUpperCase();
        const name = cleanText(inv.name);
        if (!symbol || !name || quantity <= 0 || purchasePrice <= 0 || currentPrice < 0 || !isInvestmentType(inv.type)) return;

        const newInv: Investment = {
          ...inv,
          type: inv.type,
          symbol,
          name,
          quantity,
          purchasePrice,
          currentPrice,
          purchaseDate: inv.purchaseDate ? cleanDate(inv.purchaseDate) : '',
          notes: cleanOptionalText(inv.notes, MAX_NOTE_LENGTH),
          id: generateId(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((state) => ({ investments: [...state.investments, newInv] }));
      },

      updateInvestment: (id, data) => {
        const sanitized = withoutUndefined({
          ...data,
          type: data.type === undefined || isInvestmentType(data.type) ? data.type : undefined,
          symbol: data.symbol === undefined ? undefined : cleanText(data.symbol, 24).toUpperCase(),
          name: data.name === undefined ? undefined : cleanText(data.name),
          quantity: data.quantity === undefined ? undefined : toPositiveNumber(data.quantity),
          purchasePrice: data.purchasePrice === undefined ? undefined : toPositiveNumber(data.purchasePrice),
          currentPrice: data.currentPrice === undefined ? undefined : toPositiveNumber(data.currentPrice),
          purchaseDate: data.purchaseDate === undefined ? undefined : cleanDate(data.purchaseDate),
          notes: data.notes === undefined ? undefined : cleanOptionalText(data.notes, MAX_NOTE_LENGTH),
        });
        set((state) => ({
          investments: state.investments.map((i) =>
            i.id === id ? { ...i, ...sanitized, updatedAt: nowIso() } : i
          ),
        }));
      },

      deleteInvestment: (id) => {
        set((state) => ({ investments: state.investments.filter((i) => i.id !== id) }));
      },

      updateStockPrice: (id, currentPrice) => {
        const sanitizedPrice = toPositiveNumber(currentPrice);
        set((state) => ({
          investments: state.investments.map((i) =>
            i.id === id ? { ...i, currentPrice: sanitizedPrice, updatedAt: nowIso() } : i
          ),
        }));
      },

      // ========================================
      // Insurance Actions
      // ========================================
      addInsurance: (ins) => {
        const provider = cleanText(ins.provider);
        const policyNumber = cleanText(ins.policyNumber, 64);
        const premiumAmount = toPositiveNumber(ins.premiumAmount);
        if (!provider || !policyNumber || premiumAmount <= 0 || !isInsuranceType(ins.type) || !isPremiumFrequency(ins.premiumFrequency)) return;

        const newIns: Insurance = {
          ...ins,
          provider,
          policyNumber,
          sumInsured: toPositiveNumber(ins.sumInsured),
          premiumAmount,
          startDate: ins.startDate ? cleanDate(ins.startDate) : '',
          renewalDate: cleanDate(ins.renewalDate),
          notes: cleanOptionalText(ins.notes, MAX_NOTE_LENGTH),
          id: generateId(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((state) => ({ insurance: [...state.insurance, newIns] }));
      },

      updateInsurance: (id, data) => {
        const sanitized = withoutUndefined({
          ...data,
          type: data.type === undefined || isInsuranceType(data.type) ? data.type : undefined,
          provider: data.provider === undefined ? undefined : cleanText(data.provider),
          policyNumber: data.policyNumber === undefined ? undefined : cleanText(data.policyNumber, 64),
          sumInsured: data.sumInsured === undefined ? undefined : toPositiveNumber(data.sumInsured),
          premiumAmount: data.premiumAmount === undefined ? undefined : toPositiveNumber(data.premiumAmount),
          premiumFrequency: data.premiumFrequency === undefined || isPremiumFrequency(data.premiumFrequency) ? data.premiumFrequency : undefined,
          startDate: data.startDate === undefined ? undefined : cleanDate(data.startDate),
          renewalDate: data.renewalDate === undefined ? undefined : cleanDate(data.renewalDate),
          notes: data.notes === undefined ? undefined : cleanOptionalText(data.notes, MAX_NOTE_LENGTH),
        });
        set((state) => ({
          insurance: state.insurance.map((i) =>
            i.id === id ? { ...i, ...sanitized, updatedAt: nowIso() } : i
          ),
        }));
      },

      deleteInsurance: (id) => {
        set((state) => ({ insurance: state.insurance.filter((i) => i.id !== id) }));
      },

      renewInsurance: (id, newRenewalDate) => {
        set((state) => ({
          insurance: state.insurance.map((i) =>
            i.id === id
              ? {
                  ...i,
                  renewalDate: cleanDate(newRenewalDate),
                  isActive: true,
                  updatedAt: nowIso(),
                }
              : i
          ),
        }));
      },

      // ========================================
      // Budget Actions
      // ========================================
      addBudget: (budget) => {
        const amount = toPositiveNumber(budget.amount);
        if (!budget.categoryId || amount <= 0 || !isBudgetPeriod(budget.period)) return;

        const newBudget: Budget = {
          ...budget,
          amount,
          alertThreshold: Math.min(100, Math.max(1, Math.round(toPositiveNumber(budget.alertThreshold, 90)))),
          startDate: cleanDate(budget.startDate),
          id: generateId(),
          spent: 0,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((state) => ({ budgets: [...state.budgets, newBudget] }));
      },

      updateBudget: (id, data) => {
        const sanitized = withoutUndefined({
          ...data,
          amount: data.amount === undefined ? undefined : toPositiveNumber(data.amount),
          period: data.period === undefined || isBudgetPeriod(data.period) ? data.period : undefined,
          alertThreshold: data.alertThreshold === undefined ? undefined : Math.min(100, Math.max(1, Math.round(toPositiveNumber(data.alertThreshold, 90)))),
          startDate: data.startDate === undefined ? undefined : cleanDate(data.startDate),
        });
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, ...sanitized, updatedAt: nowIso() } : b
          ),
        }));
      },

      deleteBudget: (id) => {
        set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
      },

      recalculateBudgetSpent: () => {
        set((state) => {
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          return {
            budgets: state.budgets.map((budget) => {
              const category = state.categories.find((c) => c.id === budget.categoryId);
              const spent = state.transactions
                .filter(
                  (t) =>
                    t.type === 'Expense' &&
                    t.category === category?.name &&
                    t.date.startsWith(currentMonth)
                )
                .reduce((sum, t) => sum + t.amount, 0);
              return { ...budget, spent };
            }),
          };
        });
      },

      // ========================================
      // Notification Actions
      // ========================================
      addNotification: (notif) => {
        const title = cleanText(notif.title);
        const message = cleanText(notif.message, 240);
        if (!title || !message) return;
        const newNotif: AppNotification = {
          ...notif,
          title,
          message,
          id: generateId(),
          createdAt: nowIso(),
        };
        set((state) => ({ notifications: [newNotif, ...state.notifications].slice(0, 50) }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      // ========================================
      // Settings Actions
      // ========================================
      updateSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...withoutUndefined({
              theme: settings.theme === 'light' || settings.theme === 'dark' || settings.theme === 'system' ? settings.theme : undefined,
              currency: settings.currency === undefined ? undefined : cleanText(settings.currency, 8),
              dateFormat: settings.dateFormat === undefined ? undefined : cleanText(settings.dateFormat, 16),
              numberFormat: settings.numberFormat === 'indian' || settings.numberFormat === 'international' ? settings.numberFormat : undefined,
              notificationsEnabled: settings.notificationsEnabled,
              defaultAccountId: settings.defaultAccountId === undefined ? undefined : cleanOptionalText(settings.defaultAccountId, 80),
            }),
          },
        }));
      },

      updateSecurity: (security) => {
        set((state) => {
          if (security.appLockEnabled === false) {
            return { security: defaultSecurity };
          }
          return {
            security: {
              ...state.security,
              biometricEnabled: security.biometricEnabled ?? state.security.biometricEnabled,
            },
          };
        });
      },

      setSecurityPin: async (pin) => {
        if (!isValidPin(pin)) return false;
        const pinSalt = generatePinSalt();
        const pinHash = await hashPin(pin, pinSalt);
        set((state) => ({
          security: {
            ...state.security,
            appLockEnabled: true,
            pinHash,
            pinSalt,
            isLocked: false,
            failedAttempts: 0,
            lockoutEndTime: undefined,
          },
        }));
        return true;
      },

      clearSecurityPin: () => {
        set({ security: defaultSecurity });
      },

      setAppLocked: (locked) => {
        set((state) => ({
          security: {
            ...state.security,
            isLocked: Boolean(locked && state.security.appLockEnabled),
          },
        }));
      },

      verifyPin: async (pin: string) => {
        const security = get().security;
        const lockoutEnd = security.lockoutEndTime ? new Date(security.lockoutEndTime).getTime() : 0;
        if (lockoutEnd > Date.now()) return false;
        if (!security.pinHash || !security.pinSalt) return false;

        const isValid = await verifyPinHash(pin, security.pinSalt, security.pinHash);
        if (isValid) {
          set((state) => ({
            security: { ...state.security, isLocked: false, failedAttempts: 0, lockoutEndTime: undefined },
          }));
          return true;
        }

        set((state) => {
          const failedAttempts = state.security.failedAttempts + 1;
          const lockoutEndTime =
            failedAttempts >= MAX_FAILED_PIN_ATTEMPTS
              ? new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000).toISOString()
              : undefined;
          return {
            security: {
              ...state.security,
              failedAttempts,
              lockoutEndTime,
            },
          };
        });
        return false;
      },

      // ========================================
      // UI Actions
      // ========================================
      setActiveModal: (modal, data = null) => {
        set({ activeModal: modal, modalData: data });
      },

      setSelectedAccount: (id) => {
        set({ selectedAccountId: id });
      },

      setSelectedTransaction: (id) => {
        set({ selectedTransactionId: id });
      },

      setSelectedFD: (id) => {
        set({ selectedFDId: id });
      },

      setCurrentRoute: (route) => {
        set({ currentRoute: route });
      },

      // ========================================
      // Data Management
      // ========================================
      initializeData: () => {
        set((state) => ({
          isDataLoaded: true,
          security: {
            ...state.security,
            isLocked: Boolean(state.security.appLockEnabled && state.security.pinHash && state.security.pinSalt),
          },
        }));
      },

      resetAllData: () => {
        set({
          accounts: [],
          transactions: [],
          recurringTransactions: [],
          fixedDeposits: [],
          investments: [],
          insurance: [],
          budgets: [],
          notifications: [],
          categories: defaultCategories,
          settings: defaultSettings,
          security: defaultSecurity,
          activeModal: null,
          modalData: null,
          selectedAccountId: null,
          selectedTransactionId: null,
          selectedFDId: null,
          transactionFilters: { type: 'All' },
          currentRoute: '/',
          isDataLoaded: true,
        });
      },

      exportData: () => {
        const state = get();
        const data = {
          accounts: state.accounts,
          transactions: state.transactions,
          recurringTransactions: state.recurringTransactions,
          categories: state.categories,
          fixedDeposits: state.fixedDeposits,
          investments: state.investments,
          insurance: state.insurance,
          budgets: state.budgets,
          settings: state.settings,
          security: {
            ...defaultSecurity,
            appLockEnabled: false,
          },
          exportDate: nowIso(),
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (json) => {
        try {
          if (json.length > MAX_IMPORT_BYTES) return false;
          const data = JSON.parse(json);
          if (!isRecord(data)) return false;
          const accounts = Array.isArray(data.accounts)
            ? data.accounts.map(sanitizeAccountRecord).filter((account): account is Account => Boolean(account))
            : [];
          const categories = Array.isArray(data.categories)
            ? data.categories.map(sanitizeCategoryRecord).filter((category): category is Category => Boolean(category))
            : defaultCategories;
          const finalCategories = categories.length > 0 ? categories : defaultCategories;
          const transactions = Array.isArray(data.transactions)
            ? data.transactions.map((tx) => sanitizeTransactionRecord(tx, accounts)).filter((tx): tx is Transaction => Boolean(tx))
            : [];
          const accountIds = accounts.map((account) => account.id);

          set({
            accounts,
            transactions: recalculateRunningBalances(transactions, accountIds),
            recurringTransactions: Array.isArray(data.recurringTransactions)
              ? data.recurringTransactions.map((tx) => sanitizeRecurringRecord(tx, accounts)).filter((tx): tx is RecurringTransaction => Boolean(tx))
              : [],
            categories: finalCategories,
            fixedDeposits: Array.isArray(data.fixedDeposits)
              ? data.fixedDeposits.map(sanitizeFixedDepositRecord).filter((fd): fd is FixedDeposit => Boolean(fd))
              : [],
            investments: Array.isArray(data.investments)
              ? data.investments.map(sanitizeInvestmentRecord).filter((investment): investment is Investment => Boolean(investment))
              : [],
            insurance: Array.isArray(data.insurance)
              ? data.insurance.map(sanitizeInsuranceRecord).filter((insurance): insurance is Insurance => Boolean(insurance))
              : [],
            budgets: Array.isArray(data.budgets)
              ? data.budgets.map((budget) => sanitizeBudgetRecord(budget, finalCategories)).filter((budget): budget is Budget => Boolean(budget))
              : [],
            settings: isRecord(data.settings)
              ? {
                  ...defaultSettings,
                  theme:
                    data.settings.theme === 'light' || data.settings.theme === 'dark' || data.settings.theme === 'system'
                      ? data.settings.theme
                      : defaultSettings.theme,
                  currency: cleanText(data.settings.currency, 8) || defaultSettings.currency,
                  dateFormat: cleanText(data.settings.dateFormat, 16) || defaultSettings.dateFormat,
                  numberFormat:
                    data.settings.numberFormat === 'indian' || data.settings.numberFormat === 'international'
                      ? data.settings.numberFormat
                      : defaultSettings.numberFormat,
                  notificationsEnabled: Boolean(data.settings.notificationsEnabled),
                  defaultAccountId: cleanOptionalText(data.settings.defaultAccountId, 80),
                }
              : defaultSettings,
            security: defaultSecurity,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'financehub-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        recurringTransactions: state.recurringTransactions,
        categories: state.categories,
        fixedDeposits: state.fixedDeposits,
        investments: state.investments,
        insurance: state.insurance,
        budgets: state.budgets,
        notifications: state.notifications,
        settings: state.settings,
        security: state.security,
      }),
      merge: (persistedState, currentState) => {
        if (!isRecord(persistedState)) return currentState;
        return {
          ...currentState,
          ...persistedState,
          categories: Array.isArray(persistedState.categories) ? persistedState.categories : defaultCategories,
          settings: isRecord(persistedState.settings)
            ? { ...defaultSettings, ...persistedState.settings }
            : defaultSettings,
          security: sanitizeSecurity(isRecord(persistedState.security) ? persistedState.security : undefined),
        };
      },
    }
  )
);
