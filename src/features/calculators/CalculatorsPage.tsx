import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Home, TrendingUp, Percent, FileText, ChevronRight } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { calculateEMI, calculateSIP, calculateCompoundInterest, calculateIncomeTax, formatCurrency, formatNumberIndian } from '@/services';
import type { EMIResult, SIPResult, CompoundInterestResult, TaxResult } from '@/types';

const calculators = [
  { id: 'emi', label: 'EMI Calculator', icon: Home, color: '#0F766E', desc: 'Calculate loan EMI & schedule' },
  { id: 'sip', label: 'SIP Calculator', icon: TrendingUp, color: '#6366F1', desc: 'Plan your mutual fund investments' },
  { id: 'ci', label: 'Compound Interest', icon: Percent, color: '#F59E0B', desc: 'See the power of compounding' },
  { id: 'tax', label: 'Tax Estimator', icon: FileText, color: '#10B981', desc: 'Estimate your income tax (India)' },
];

export function CalculatorsPage() {
  const [activeCalc, setActiveCalc] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1.5">Calculators</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Plan your finances with precision</p>

      {!activeCalc ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {calculators.map((calc, i) => {
            const Icon = calc.icon;
            return (
              <motion.button
                key={calc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCalc(calc.id)}
                className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] text-left"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${calc.color}15` }}
                >
                  <Icon size={22} style={{ color: calc.color }} />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  {calc.label}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">{calc.desc}</p>
                <ChevronRight size={16} className="text-[var(--text-tertiary)] mt-3" />
              </motion.button>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={() => setActiveCalc(null)}
            className="text-sm text-[var(--primary)] font-medium mb-4 flex items-center gap-1"
          >
            ← Back to Calculators
          </button>
          {activeCalc === 'emi' && <EMICalculator />}
          {activeCalc === 'sip' && <SIPCalculator />}
          {activeCalc === 'ci' && <CompoundInterestCalculator />}
          {activeCalc === 'tax' && <TaxEstimator />}
        </motion.div>
      )}
    </div>
  );
}

// EMI Calculator
function EMICalculator() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');

  const result = useMemo<EMIResult | null>(() => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const t = parseFloat(tenure);
    if (!Number.isFinite(p) || !Number.isFinite(r) || !Number.isFinite(t) || p <= 0 || r < 0 || t <= 0) return null;
    return calculateEMI(p, r, t);
  }, [principal, rate, tenure]);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <InputField label="Loan Amount (₹)" value={principal} onChange={setPrincipal} type="number" />
        <InputField label="Interest Rate (% per annum)" value={rate} onChange={setRate} type="number" step="0.01" />
        <InputField label="Loan Tenure (Years)" value={tenure} onChange={setTenure} type="number" />
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80 mb-1">Monthly EMI</p>
            <p className="text-3xl font-bold tabular-nums">{formatCurrency(result.emi)}</p>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs opacity-70">Principal</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(result.principal)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Total Interest</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(result.totalInterest)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Total Payment</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(result.totalPayment)}</p>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Principal vs Interest</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Principal', value: result.principal },
                      { name: 'Interest', value: result.totalInterest },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#0F766E" />
                    <Cell fill="#F59E0B" />
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Amortization Table */}
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Yearly Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[var(--text-tertiary)] text-xs uppercase">
                    <th className="text-left pb-2">Year</th>
                    <th className="text-right pb-2">Principal</th>
                    <th className="text-right pb-2">Interest</th>
                    <th className="text-right pb-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {result.schedule.slice(0, 5).map((s) => (
                    <tr key={s.year}>
                      <td className="py-2 text-[var(--text-primary)]">{s.year}</td>
                      <td className="py-2 text-right tabular-nums text-[var(--text-primary)]">{formatCurrency(s.principal)}</td>
                      <td className="py-2 text-right tabular-nums text-[var(--accent)]">{formatCurrency(s.interest)}</td>
                      <td className="py-2 text-right tabular-nums text-[var(--text-primary)]">{formatCurrency(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// SIP Calculator
function SIPCalculator() {
  const [monthly, setMonthly] = useState('');
  const [returns, setReturns] = useState('');
  const [years, setYears] = useState('');

  const result = useMemo<SIPResult | null>(() => {
    const m = parseFloat(monthly);
    const r = parseFloat(returns);
    const y = parseFloat(years);
    if (!Number.isFinite(m) || !Number.isFinite(r) || !Number.isFinite(y) || m <= 0 || r < 0 || y <= 0) return null;
    return calculateSIP(m, r, y);
  }, [monthly, returns, years]);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <InputField label="Monthly Investment (₹)" value={monthly} onChange={setMonthly} type="number" />
        <InputField label="Expected Return (% per annum)" value={returns} onChange={setReturns} type="number" step="0.01" />
        <InputField label="Duration (Years)" value={years} onChange={setYears} type="number" />
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-br from-[var(--secondary)] to-[#4F46E5] rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80 mb-1">Maturity Amount</p>
            <p className="text-3xl font-bold tabular-nums">{formatCurrency(result.maturityAmount)}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs opacity-70">Total Invested</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(result.totalInvestment)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Wealth Gained</p>
                <p className="text-sm font-semibold tabular-nums text-emerald-300">+{formatCurrency(result.wealthGained)}</p>
              </div>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Growth Projection</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.yearlyBreakdown}>
                  <defs>
                    <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatNumberIndian(v)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill="url(#sipGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Compound Interest Calculator
function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [frequency, setFrequency] = useState('quarterly');

  const result = useMemo<CompoundInterestResult | null>(() => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const t = parseFloat(time);
    if (!Number.isFinite(p) || !Number.isFinite(r) || !Number.isFinite(t) || p <= 0 || r < 0 || t <= 0) return null;
    return calculateCompoundInterest(p, r, t, frequency);
  }, [principal, rate, time, frequency]);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <InputField label="Principal Amount (₹)" value={principal} onChange={setPrincipal} type="number" />
        <InputField label="Annual Interest Rate (%)" value={rate} onChange={setRate} type="number" step="0.01" />
        <InputField label="Time (Years)" value={time} onChange={setTime} type="number" />
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Compounding Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="annually">Annually</option>
            <option value="semiannually">Semi-Annually</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-br from-[var(--accent)] to-[#D97706] rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80 mb-1">Maturity Amount</p>
            <p className="text-3xl font-bold tabular-nums">{formatCurrency(result.maturityAmount)}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs opacity-70">Total Interest</p>
                <p className="text-sm font-semibold tabular-nums">+{formatCurrency(result.totalInterest)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Principal</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(parseFloat(principal))}</p>
              </div>
            </div>
          </div>

          {/* Yearly Table */}
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Yearly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[var(--text-tertiary)] text-xs uppercase">
                    <th className="text-left pb-2">Year</th>
                    <th className="text-right pb-2">Interest</th>
                    <th className="text-right pb-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {result.yearlyBreakdown.map((y) => (
                    <tr key={y.year}>
                      <td className="py-2 text-[var(--text-primary)]">{y.year}</td>
                      <td className="py-2 text-right tabular-nums text-emerald-500">+{formatCurrency(y.interest)}</td>
                      <td className="py-2 text-right tabular-nums text-[var(--text-primary)]">{formatCurrency(y.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Tax Estimator
function TaxEstimator() {
  const [income, setIncome] = useState('');
  const [deductions80C, setDeductions80C] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');

  const result = useMemo<TaxResult | null>(() => {
    const inc = parseFloat(income);
    const d80c = parseFloat(deductions80C);
    const other = parseFloat(otherDeductions);
    if (!Number.isFinite(inc) || inc <= 0) return null;
    return calculateIncomeTax(
      inc,
      Number.isFinite(d80c) ? d80c : 0,
      Number.isFinite(other) ? other : 0
    );
  }, [income, deductions80C, otherDeductions]);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <InputField label="Annual Income (₹)" value={income} onChange={setIncome} type="number" />
        <InputField label="80C Deductions (₹)" value={deductions80C} onChange={setDeductions80C} type="number" />
        <InputField label="Other Deductions (₹)" value={otherDeductions} onChange={setOtherDeductions} type="number" />
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80 mb-1">Total Tax Payable</p>
            <p className="text-3xl font-bold tabular-nums">{formatCurrency(result.totalPayable)}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs opacity-70">Taxable Income</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(result.taxableIncome)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Base Tax</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(result.totalTax)}</p>
              </div>
            </div>
          </div>

          {/* Slab Breakdown */}
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Tax Slab Breakdown</h3>
            <div className="space-y-3">
              {result.taxBySlab.map((slab, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl">
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{slab.slab}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{slab.rate}%</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(slab.amount)}
                  </p>
                </div>
              ))}
              {result.surcharge > 0 && (
                <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl">
                  <p className="text-sm text-[var(--text-secondary)]">Surcharge</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatCurrency(result.surcharge)}</p>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl">
                <p className="text-sm text-[var(--text-secondary)]">Health & Education Cess (4%)</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatCurrency(result.cess)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Shared Input Component
function InputField({
  label,
  value,
  onChange,
  type = 'text',
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
      />
    </div>
  );
}
