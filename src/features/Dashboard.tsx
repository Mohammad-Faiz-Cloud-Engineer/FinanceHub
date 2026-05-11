import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowRightLeft,
  Landmark,
  TrendingUp,
  FileText,
  Calculator,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
} from 'lucide-react';
import { useFinanceStore } from '@/store';
import { useMonthlySummary } from '@/hooks';
import { formatCurrency, maskAccountNumber, formatDateRelative } from '@/services';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';

const quickActions = [
  { label: 'Add Txn', icon: Plus, action: '/transactions', color: 'var(--primary)' },
  { label: 'Transfer', icon: ArrowRightLeft, action: '/transactions', color: 'var(--secondary)' },
  { label: 'Add FD', icon: Landmark, action: '/fixed-deposits', color: 'var(--accent)' },
  { label: 'Invest', icon: TrendingUp, action: '/investments', color: 'var(--success)' },
  { label: 'Export', icon: FileText, action: '/export', color: '#8B5CF6' },
  { label: 'Calc', icon: Calculator, action: '/calculators', color: '#EC4899' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { accounts, transactions, fixedDeposits, getNetWorth, initializeData } = useFinanceStore();
  const monthlySummary = useMonthlySummary(6);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const netWorth = getNetWorth();

  // Current month stats
  const currentMonth = monthlySummary[monthlySummary.length - 1] || {
    income: 0,
    expense: 0,
    savings: 0,
    savingsRate: 0,
  };

  // Recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Active FDs summary
  const activeFDs = fixedDeposits.filter(
    (fd) => fd.status === 'Active' || fd.status === 'MaturingSoon'
  );
  const totalFDPrincipal = activeFDs.reduce((s, fd) => s + fd.principal, 0);
  const totalFDInterest = activeFDs.reduce((s, fd) => s + fd.interestEarned, 0);

  return (
    <div className="min-h-screen pb-20 pt-16 px-3 sm:px-6 max-w-3xl mx-auto">
      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[var(--surface)] rounded-xl p-4 mb-4 border border-[var(--border)]"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Total Net Worth
          </span>
          <div className="w-16 h-8">
            {/* Mini sparkline placeholder */}
            <svg viewBox="0 0 80 30" className="w-full h-full">
              <defs>
                <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 25 Q10 20, 20 22 T40 15 T60 18 T80 8"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0 25 Q10 20, 20 22 T40 15 T60 18 T80 8 V30 H0 Z"
                fill="url(#sparklineGrad)"
              />
            </svg>
          </div>
        </div>
        <AmountDisplay value={netWorth} size="large" className="mb-3" />

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border)]">
          <div>
            <div className="flex items-center gap-1 text-emerald-500 mb-1">
              <ArrowUpRight size={12} />
              <span className="text-[10px] font-medium">Income</span>
            </div>
            <AmountDisplay value={currentMonth.income} size="small" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-red-500 mb-1">
              <ArrowDownRight size={12} />
              <span className="text-[10px] font-medium">Expense</span>
            </div>
            <AmountDisplay value={currentMonth.expense} size="small" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[var(--primary)] mb-1">
              <PiggyBank size={12} />
              <span className="text-[10px] font-medium">Savings</span>
            </div>
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {currentMonth.savingsRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.action)}
                className="flex flex-col items-center gap-1.5 min-w-[56px]"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Icon size={18} style={{ color: action.color }} />
                </div>
                <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Account Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Your Accounts
          </h2>
          <button
            onClick={() => navigate('/accounts')}
            className="text-xs text-[var(--primary)] font-medium flex items-center gap-1"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {accounts.length === 0 ? (
          <EmptyState
            illustration="/empty-accounts.png"
            title="No Accounts Yet"
            description="Add your first bank account to start tracking your finances."
            actionLabel="Add Account"
            onAction={() => navigate('/accounts')}
          />
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/accounts')}
                className="bg-[var(--surface)] rounded-xl p-4 min-w-[240px] w-[240px] flex-shrink-0 border border-[var(--border)] cursor-pointer snap-start"
                style={{
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.bankName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {account.bankName}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      {maskAccountNumber(account.accountNumber)}
                    </p>
                  </div>
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${account.color}15`,
                      color: account.color,
                    }}
                  >
                    {account.accountType}
                  </span>
                </div>
                <AmountDisplay value={account.balance} size="medium" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mb-4"
      >
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between p-4 pb-2.5">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Recent Transactions
            </h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-[var(--primary)] font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <EmptyState
              illustration="/empty-transactions.png"
              title="No Transactions Yet"
              description="Start recording your income and expenses."
              actionLabel="Add Transaction"
              onAction={() => navigate('/transactions')}
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => navigate('/transactions')}
                  className="flex items-center gap-3 p-3 hover:bg-[var(--background)] transition-colors cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'Income'
                        ? 'bg-emerald-100 text-emerald-600'
                        : tx.type === 'Expense'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {tx.type === 'Income' ? (
                      <ArrowUpRight size={14} />
                    ) : tx.type === 'Expense' ? (
                      <ArrowDownRight size={14} />
                    ) : (
                      <ArrowRightLeft size={14} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      {tx.category} • {formatDateRelative(tx.date)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      tx.type === 'Income'
                        ? 'text-emerald-500'
                        : tx.type === 'Expense'
                        ? 'text-red-500'
                        : 'text-blue-500'
                    }`}
                  >
                    {tx.type === 'Income' ? '+' : tx.type === 'Expense' ? '-' : ''}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Fixed Deposits Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mb-4"
      >
        <div
          className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]"
          style={{
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Fixed Deposits
            </h2>
            <div className="flex items-center gap-2">
              {activeFDs.length > 0 && (
                <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] font-medium px-1.5 py-0.5 rounded-full">
                  {activeFDs.length} Active
                </span>
              )}
              <button
                onClick={() => navigate('/fixed-deposits')}
                className="text-xs text-[var(--primary)] font-medium flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {fixedDeposits.length === 0 ? (
            <EmptyState
              illustration="/empty-fd.png"
              title="No Fixed Deposits"
              description="Start tracking your FDs and monitor interest earnings."
              actionLabel="Add FD"
              onAction={() => navigate('/fixed-deposits')}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Total Invested</p>
                  <AmountDisplay value={totalFDPrincipal} size="small" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Interest Earned</p>
                  <div className="flex items-center gap-1">
                    <AmountDisplay value={totalFDInterest} size="small" showSign />
                  </div>
                </div>
              </div>

              {/* FD List */}
              <div className="space-y-2">
                {fixedDeposits.slice(0, 3).map((fd) => (
                  <div
                    key={fd.id}
                    onClick={() => navigate('/fixed-deposits')}
                    className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl cursor-pointer hover:bg-[var(--background)]/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                        <Landmark size={14} className="text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {fd.bankName}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {fd.fdId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatCurrency(fd.principal)}
                      </p>
                      <StatusBadge status={fd.status} size="small" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Budget Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <BudgetOverview />
      </motion.div>
    </div>
  );
}

// Budget Overview Sub-component
function BudgetOverview() {
  const navigate = useNavigate();
  const budgets = useFinanceStore((s) => s.budgets);
  const categories = useFinanceStore((s) => s.categories);
  const transactions = useFinanceStore((s) => s.transactions);

  if (budgets.length === 0) return null;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const budgetsWithSpent = budgets.map((budget) => {
    const category = categories.find((c) => c.id === budget.categoryId);
    const spent = transactions
      .filter((tx) => tx.type === 'Expense' && tx.category === category?.name && tx.date.startsWith(currentMonth))
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { ...budget, spent };
  });
  const totalBudget = budgetsWithSpent.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsWithSpent.reduce((s, b) => s + b.spent, 0);
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (utilization / 100) * circumference;

  const getColor = () => {
    if (utilization >= 100) return 'var(--danger)';
    if (utilization >= 80) return 'var(--accent)';
    return 'var(--success)';
  };

  return (
    <div
      className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Monthly Budget
        </h2>
        <button
          onClick={() => navigate('/budgets')}
          className="text-sm text-[var(--primary)] font-medium flex items-center gap-1"
        >
          Manage <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={getColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {Math.round(utilization)}%
            </span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            <span className="font-semibold text-[var(--text-primary)]">
              {formatCurrency(totalSpent)}
            </span>{' '}
            of {formatCurrency(totalBudget)} spent
          </p>

          <div className="space-y-2 mt-3">
            {budgetsWithSpent.slice(0, 3).map((budget) => {
              const cat = categories.find((c) => c.id === budget.categoryId);
              const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
              return (
                <div key={budget.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {cat?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--background)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor:
                          pct >= 100
                            ? 'var(--danger)'
                            : pct >= 80
                            ? 'var(--accent)'
                            : 'var(--success)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
