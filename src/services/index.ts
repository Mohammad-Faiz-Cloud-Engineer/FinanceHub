// ============================================
// FinanceHub - Services & Utilities
// ============================================
import type {
  Transaction,
  RecurringTransaction,
  FixedDeposit,
  CompoundingFrequency,
  FDCalculationResult,
  EMIResult,
  SIPResult,
  CompoundInterestResult,
  TaxResult,
} from '@/types';

// ============================================
// ID Generation
// ============================================
function getRandomHex(bytes: number): string {
  const values = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
}

export function generateId(): string {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}_${getRandomHex(8)}`;
  }
}

export function generateFDId(): string {
  const prefix = 'FD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = getRandomHex(3).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// ============================================
// PIN Hashing
// ============================================
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function generatePinSalt(): string {
  try {
    return getRandomHex(16);
  } catch {
    throw new Error('Secure random generation is unavailable in this browser.');
  }
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  if (!isValidPin(pin)) {
    throw new Error('PIN must be exactly 4 digits.');
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure PIN hashing is unavailable in this browser.');
  }

  const encoded = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

export async function verifyPinHash(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  if (!salt || !expectedHash || !isValidPin(pin)) return false;
  const actualHash = await hashPin(pin, salt);
  return actualHash === expectedHash;
}

// ============================================
// Date Utilities
// ============================================
function parseDate(date: string | Date): Date | null {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(date: string | Date, format: string = 'DD/MM/YYYY'): string {
  const d = parseDate(date);
  if (!d) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatDateRelative(date: string): string {
  const d = parseDate(date);
  if (!d) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return formatDate(date);
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
}

export function getDaysDifference(date1: string, date2: string): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  if (!d1 || !d2) return 0;
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function addMonths(date: string, months: number): string {
  const d = parseDate(date);
  if (!d || !Number.isFinite(months)) return '';
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export function getMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const parsedYear = Number.parseInt(year, 10);
  const parsedMonth = Number.parseInt(month, 10);
  if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return '';
  }
  const d = new Date(parsedYear, parsedMonth - 1, 1);
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

// ============================================
// Number Formatting
// ============================================
export function formatNumberIndian(num: number): string {
  if (isNaN(num)) return '0';
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 10000000) {
    return `${sign}${(absNum / 10000000).toFixed(2)} Cr`;
  }
  if (absNum >= 100000) {
    return `${sign}${(absNum / 100000).toFixed(2)} L`;
  }
  if (absNum >= 1000) {
    return `${sign}${absNum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  return `${sign}${absNum.toFixed(2)}`;
}

export function formatCurrency(
  amount: number,
  currency: string = '₹',
  format: 'indian' | 'international' = 'indian'
): string {
  if (!Number.isFinite(amount)) return `${currency}0`;

  if (format === 'indian') {
    return `${currency}${formatNumberIndian(amount)}`;
  }

  return `${amount < 0 ? '-' : ''}${currency}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyFull(
  amount: number,
  currency: string = '₹',
  format: 'indian' | 'international' = 'indian'
): string {
  if (!Number.isFinite(amount)) return `${currency}0.00`;

  if (format === 'indian') {
    const parts = Math.abs(amount).toFixed(2).split('.');
    const intPart = parts[0];
    const decimal = parts[1];

    let result = '';
    const len = intPart.length;

    if (len > 3) {
      result = intPart.slice(-3);
      let remaining = intPart.slice(0, -3);
      while (remaining.length > 0) {
        result = remaining.slice(-2) + ',' + result;
        remaining = remaining.slice(0, -2);
      }
    } else {
      result = intPart;
    }

    const sign = amount < 0 ? '-' : '';
    return `${sign}${currency}${result}.${decimal}`;
  }

  return `${amount < 0 ? '-' : ''}${currency}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function maskAccountNumber(number: string): string {
  if (!number || number.length < 4) return '****';
  const last4 = number.slice(-4);
  const masked = '*'.repeat(Math.min(number.length - 4, 8));
  return `${masked} ${last4}`;
}

// ============================================
// FD Calculation Engine
// ============================================
export function calculateFDMaturity(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  compounding: CompoundingFrequency
): FDCalculationResult {
  if (principal <= 0 || annualRate < 0 || tenureMonths <= 0) {
    return {
      maturityAmount: 0,
      interestEarned: 0,
      tdsAmount: 0,
      netInterest: 0,
      interestBreakdown: [],
    };
  }

  const P = principal;
  const r = annualRate / 100;
  const normalizedTenureMonths = Math.min(Math.round(tenureMonths), 1200);
  const t = normalizedTenureMonths / 12;

  const nMap: Record<CompoundingFrequency, number> = {
    Monthly: 12,
    Quarterly: 4,
    SemiAnnual: 2,
    Annual: 1,
  };
  const n = nMap[compounding] || 4;

  // A = P(1 + r/n)^(nt)
  const A = P * Math.pow(1 + r / n, n * t);
  const interestEarned = A - P;

  // TDS: 10% if interest > ₹10,000
  const tdsRate = interestEarned > 10000 ? 0.1 : 0;
  const tdsAmount = interestEarned * tdsRate;
  const netInterest = interestEarned - tdsAmount;

  // Generate interest breakdown
  const breakdown: FDCalculationResult['interestBreakdown'] = [];
  const periodMonths = Math.ceil(normalizedTenureMonths / 3); // Quarterly intervals
  for (let i = 1; i <= Math.min(periodMonths, 40); i++) {
    const periodTime = (i * 3) / 12;
    const periodA = P * Math.pow(1 + r / n, n * Math.min(periodTime, t));
    const periodInterest = periodA - P;
    const prevInterest =
      i > 1
        ? P * Math.pow(1 + r / n, n * Math.min(((i - 1) * 3) / 12, t)) - P
        : 0;

    breakdown.push({
      period: `Q${i}`,
      interestAccrued: Math.round((periodInterest - prevInterest) * 100) / 100,
      cumulativeInterest: Math.round(periodInterest * 100) / 100,
      balance: Math.round(periodA * 100) / 100,
    });
  }

  return {
    maturityAmount: Math.round(A * 100) / 100,
    interestEarned: Math.round(interestEarned * 100) / 100,
    tdsAmount: Math.round(tdsAmount * 100) / 100,
    netInterest: Math.round(netInterest * 100) / 100,
    interestBreakdown: breakdown,
  };
}

export function calculateFDInterestAccrued(fd: FixedDeposit): number {
  if (fd.status === 'Closed') return 0;
  if (fd.principal <= 0 || fd.interestRate < 0) return 0;

  const P = fd.principal;
  const r = fd.interestRate / 100;
  const now = new Date();
  const start = parseDate(fd.startDate);
  const maturity = parseDate(fd.maturityDate);
  if (!start || !maturity) return 0;

  const effectiveEnd = now < maturity ? now : maturity;
  const elapsedMs = effectiveEnd.getTime() - start.getTime();
  const elapsedYears = elapsedMs / (365.25 * 24 * 60 * 60 * 1000);

  if (elapsedYears <= 0) return 0;

  const nMap: Record<CompoundingFrequency, number> = {
    Monthly: 12,
    Quarterly: 4,
    SemiAnnual: 2,
    Annual: 1,
  };
  const n = nMap[fd.compoundingFrequency] || 4;

  const A = P * Math.pow(1 + r / n, n * elapsedYears);
  return Math.round((A - P) * 100) / 100;
}

export function getFDStatus(fd: FixedDeposit): FixedDeposit['status'] {
  const now = new Date();
  const maturity = parseDate(fd.maturityDate);
  if (!maturity) return fd.status;
  const daysToMaturity = Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (fd.status === 'Closed') return 'Closed';
  if (daysToMaturity <= 0) return 'Matured';
  if (daysToMaturity <= 30) return 'MaturingSoon';
  return 'Active';
}

// ============================================
// Running Balance Calculation
// ============================================
export function calculateRunningBalance(
  transactions: Transaction[],
  openingBalance: number = 0
): Transaction[] {
  const sorted = [...transactions].sort(
    (a, b) => {
      const aTime = parseDate(a.date)?.getTime() ?? 0;
      const bTime = parseDate(b.date)?.getTime() ?? 0;
      return aTime - bTime;
    }
  );

  let balance = openingBalance;
  return sorted.map((tx) => {
    if (tx.type === 'Income') balance += tx.amount;
    else if (tx.type === 'Expense') balance -= tx.amount;
    else if (tx.type === 'Transfer') balance -= tx.amount;

    return { ...tx, runningBalance: Math.round(balance * 100) / 100 };
  });
}

// ============================================
// Recurring Transaction Processor
// ============================================
export function processRecurringTransactions(
  recurringTxs: RecurringTransaction[]
): { transaction: Omit<Transaction, 'id' | 'runningBalance' | 'createdAt' | 'updatedAt'>; recurringId: string; nextDate: string }[] {
  const now = new Date();
  const result: {
    transaction: Omit<Transaction, 'id' | 'runningBalance' | 'createdAt' | 'updatedAt'>;
    recurringId: string;
    nextDate: string;
  }[] = [];

  recurringTxs.forEach((rtx) => {
    if (!rtx.isActive) return;
    const endDate = rtx.endDate ? parseDate(rtx.endDate) : null;
    if (endDate && endDate < now) return;

    const nextDate = parseDate(rtx.nextDate);
    if (!nextDate) return;
    if (nextDate > now) return;

    // Generate transaction
    const tx: Omit<Transaction, 'id' | 'runningBalance' | 'createdAt' | 'updatedAt'> = {
      accountId: rtx.accountId,
      type: rtx.type,
      amount: rtx.amount,
      description: rtx.description,
      category: rtx.category,
      date: rtx.nextDate,
      tags: rtx.tags,
      isRecurring: true,
      recurringId: rtx.id,
    };

    // Calculate next date
    const newNext = new Date(nextDate);
    switch (rtx.frequency) {
      case 'Daily':
        newNext.setDate(newNext.getDate() + 1);
        break;
      case 'Weekly':
        newNext.setDate(newNext.getDate() + 7);
        break;
      case 'Monthly':
        newNext.setMonth(newNext.getMonth() + 1);
        break;
      case 'Yearly':
        newNext.setFullYear(newNext.getFullYear() + 1);
        break;
    }

    result.push({
      transaction: tx,
      recurringId: rtx.id,
      nextDate: newNext.toISOString().split('T')[0],
    });
  });

  return result;
}

// ============================================
// Financial Calculator Engines
// ============================================
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureYears: number
): EMIResult {
  if (principal <= 0 || annualRate < 0 || tenureYears <= 0) {
    return { emi: 0, totalInterest: 0, totalPayment: 0, principal: 0, schedule: [] };
  }

  const P = principal;
  const r = annualRate / (12 * 100);
  const n = Math.min(Math.round(tenureYears * 12), 1200);

  const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - P;

  // Amortization schedule
  const schedule: EMIResult['schedule'] = [];
  let balance = P;
  const yearlyPrincipal: number[] = [];
  const yearlyInterest: number[] = [];

  for (let i = 1; i <= n; i++) {
    const interestPayment = balance * r;
    const principalPayment = emi - interestPayment;
    balance -= principalPayment;

    const yearIndex = Math.floor((i - 1) / 12);
    yearlyPrincipal[yearIndex] = (yearlyPrincipal[yearIndex] || 0) + principalPayment;
    yearlyInterest[yearIndex] = (yearlyInterest[yearIndex] || 0) + interestPayment;
  }

  // Reset balance for schedule
  balance = P;
  for (let year = 1; year <= Math.ceil(n / 12); year++) {
    const yearPrincipal = yearlyPrincipal[year - 1] || 0;
    const yearInterest = yearlyInterest[year - 1] || 0;
    balance -= yearPrincipal;
    schedule.push({
      year,
      principal: Math.round(yearPrincipal * 100) / 100,
      interest: Math.round(yearInterest * 100) / 100,
      balance: Math.round(Math.max(balance, 0) * 100) / 100,
    });
  }

  return {
    emi: Math.round(emi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    principal: P,
    schedule,
  };
}

export function calculateSIP(
  monthlyInvestment: number,
  expectedReturn: number,
  durationYears: number
): SIPResult {
  if (monthlyInvestment <= 0 || expectedReturn < 0 || durationYears <= 0) {
    return { totalInvestment: 0, wealthGained: 0, maturityAmount: 0, yearlyBreakdown: [] };
  }

  const P = monthlyInvestment;
  const r = expectedReturn / (12 * 100);
  const normalizedYears = Math.min(Math.round(durationYears), 100);
  const n = normalizedYears * 12;

  // FV = P × ((1 + r)^n - 1) / r × (1 + r)
  const fv =
    r === 0
      ? P * n
      : P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

  const totalInvestment = P * n;
  const wealthGained = fv - totalInvestment;

  // Yearly breakdown
  const yearlyBreakdown: SIPResult['yearlyBreakdown'] = [];
  for (let year = 1; year <= normalizedYears; year++) {
    const yearMonths = year * 12;
    const yearFV =
      r === 0
        ? P * yearMonths
        : P * ((Math.pow(1 + r, yearMonths) - 1) / r) * (1 + r);
    yearlyBreakdown.push({
      year,
      investment: P * yearMonths,
      value: Math.round(yearFV * 100) / 100,
      returns: Math.round((yearFV - P * yearMonths) * 100) / 100,
    });
  }

  return {
    totalInvestment,
    wealthGained: Math.round(wealthGained * 100) / 100,
    maturityAmount: Math.round(fv * 100) / 100,
    yearlyBreakdown,
  };
}

export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  timeYears: number,
  frequency: string
): CompoundInterestResult {
  if (principal <= 0 || annualRate < 0 || timeYears <= 0) {
    return { maturityAmount: 0, totalInterest: 0, yearlyBreakdown: [] };
  }

  const P = principal;
  const r = annualRate / 100;
  const t = Math.min(Math.round(timeYears), 100);

  const nMap: Record<string, number> = {
    annually: 1,
    semiannually: 2,
    quarterly: 4,
    monthly: 12,
  };
  const n = nMap[frequency] || 4;

  const A = P * Math.pow(1 + r / n, n * t);
  const totalInterest = A - P;

  const yearlyBreakdown: CompoundInterestResult['yearlyBreakdown'] = [];
  for (let year = 1; year <= timeYears; year++) {
    const yearA = P * Math.pow(1 + r / n, n * year);
    const prevA =
      year > 1 ? P * Math.pow(1 + r / n, n * (year - 1)) : P;
    yearlyBreakdown.push({
      year,
      principal: P,
      interest: Math.round((yearA - prevA) * 100) / 100,
      balance: Math.round(yearA * 100) / 100,
    });
  }

  return {
    maturityAmount: Math.round(A * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    yearlyBreakdown,
  };
}

export function calculateIncomeTax(annualIncome: number, deductions80C: number, otherDeductions: number): TaxResult {
  const normalizedIncome = Number.isFinite(annualIncome) ? Math.max(0, annualIncome) : 0;
  const normalized80C = Number.isFinite(deductions80C) ? Math.max(0, deductions80C) : 0;
  const normalizedOtherDeductions = Number.isFinite(otherDeductions) ? Math.max(0, otherDeductions) : 0;

  // India Old Regime FY 2024-25
  const taxableIncome = Math.max(0, normalizedIncome - Math.min(normalized80C, 150000) - normalizedOtherDeductions);

  const slabs = [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.2 },
    { limit: Infinity, rate: 0.3 },
  ];

  const taxBySlab: TaxResult['taxBySlab'] = [];
  let remainingIncome = taxableIncome;
  let prevLimit = 0;
  let totalTax = 0;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;
    const taxableAtSlab = Math.min(remainingIncome, slab.limit - prevLimit);
    const tax = taxableAtSlab * slab.rate;

    if (taxableAtSlab > 0) {
      taxBySlab.push({
        slab:
          slab.limit === Infinity
            ? `Above ${formatNumberIndian(prevLimit)}`
            : `${formatNumberIndian(prevLimit)} - ${formatNumberIndian(slab.limit)}`,
        rate: slab.rate * 100,
        amount: Math.round(tax * 100) / 100,
      });
    }

    totalTax += tax;
    remainingIncome -= taxableAtSlab;
    prevLimit = slab.limit;
  }

  // Section 87A rebate
  if (taxableIncome <= 500000) {
    totalTax = Math.max(0, totalTax - 12500);
  }

  const surcharge = taxableIncome > 5000000 ? totalTax * 0.1 : 0;
  const cess = (totalTax + surcharge) * 0.04;
  const totalPayable = totalTax + surcharge + cess;

  return {
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    taxBySlab,
    totalTax: Math.round(totalTax * 100) / 100,
    surcharge: Math.round(surcharge * 100) / 100,
    cess: Math.round(cess * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
  };
}

// ============================================
// Storage Wrapper
// ============================================
export const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage full or unavailable
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

