import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { Wallet, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMonthlySummary, useCategorySummary } from '@/hooks';
import { formatCurrency, formatNumberIndian } from '@/services';
import { StatCard } from '@/components/common/StatCard';

const timePeriods = [
  { label: 'This Month', value: 1 },
  { label: 'Last 3M', value: 3 },
  { label: 'Last 6M', value: 6 },
  { label: 'This Year', value: 12 },
];

const CHART_COLORS = [
  '#0F766E', '#6366F1', '#F59E0B', '#10B981', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6',
];

function AnalyticsTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[var(--surface)] rounded-lg p-2.5 shadow-lg border border-[var(--border)]">
      <p className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState(6);
  const monthlySummary = useMonthlySummary(period);
  const expenseCategories = useCategorySummary('Expense');

  const totalIncome = monthlySummary.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlySummary.reduce((s, m) => s + m.expense, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Prepare chart data
  const barChartData = monthlySummary.map((m) => ({
    name: m.month.slice(5),
    Income: m.income,
    Expense: m.expense,
  }));

  const pieData = expenseCategories.slice(0, 8).map((c) => ({
    name: c.categoryName,
    value: c.amount,
    color: c.categoryColor,
  }));

  const areaChartData = monthlySummary.map((m) => ({
    name: m.month.slice(5),
    Savings: m.savings,
    Cumulative: monthlySummary
      .slice(0, monthlySummary.indexOf(m) + 1)
      .reduce((s, x) => s + x.savings, 0),
  }));

  return (
    <div className="min-h-screen pb-20 pt-16 px-3 sm:px-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4">Analytics</h1>

      {/* Time Period Selector */}
      <div className="flex bg-[var(--surface)] rounded-lg p-0.5 mb-4 border border-[var(--border)]">
        {timePeriods.map((tp) => (
          <button
            key={tp.value}
            onClick={() => setPeriod(tp.value)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
              period === tp.value
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tp.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Total Income"
          value={totalIncome}
          icon={ArrowUpRight}
          color="#10B981"
        />
        <StatCard
          label="Total Expenses"
          value={totalExpense}
          icon={ArrowDownRight}
          color="#EF4444"
        />
        <StatCard
          label="Net Savings"
          value={netSavings}
          icon={Wallet}
          color="var(--primary)"
        />
        <StatCard
          label="Savings Rate"
          value={Math.round(savingsRate)}
          icon={Percent}
          color="var(--secondary)"
        />
      </div>

      {/* Income vs Expense Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--surface)] rounded-xl p-3.5 border border-[var(--border)] mb-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Income vs Expense
        </h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} barGap={1} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatNumberIndian(v)}
              />
              <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: 'var(--background)' }} />
              <Legend
                wrapperStyle={{ fontSize: 10, color: 'var(--text-secondary)', paddingTop: '8px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="Income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={24} />
              <Bar dataKey="Expense" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--surface)] rounded-xl p-3.5 border border-[var(--border)] mb-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Spending by Category
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<AnalyticsTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {pieData.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color || CHART_COLORS[i] }}
                />
                <span className="text-xs text-[var(--text-primary)] flex-1">{cat.name}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatCurrency(cat.value)}
                </span>
                <div className="w-14 h-1 bg-[var(--background)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(cat.value / (pieData[0]?.value || 1) * 100, 100)}%`,
                      backgroundColor: cat.color || CHART_COLORS[i],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Savings Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[var(--surface)] rounded-xl p-3.5 border border-[var(--border)] mb-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Savings Trend
        </h2>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatNumberIndian(v)}
              />
              <Tooltip content={<AnalyticsTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="Cumulative"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#savingsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Categories Detail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[var(--surface)] rounded-xl p-3.5 border border-[var(--border)]"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Top Spending Categories
        </h2>
        <div className="space-y-2.5">
          {expenseCategories.slice(0, 5).map((cat, i) => (
            <div key={cat.categoryId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.categoryColor }}
                  />
                  <span className="text-xs text-[var(--text-primary)]">{cat.categoryName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] w-8 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-[var(--background)] rounded-full overflow-hidden ml-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.percentage}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.categoryColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
