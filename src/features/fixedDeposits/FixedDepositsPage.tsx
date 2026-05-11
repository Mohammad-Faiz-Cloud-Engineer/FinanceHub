import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Landmark,
  ArrowRight,
  Pencil,
  RotateCcw,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinanceStore } from '@/store';
import { useFDInterestAccrued } from '@/hooks';
import {
  formatCurrency,
  formatDate,
  calculateFDMaturity,
  getDaysDifference,
} from '@/services';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import type { CompoundingFrequency, FixedDeposit } from '@/types';

const bankSuggestions = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Bank of Baroda',
  'Punjab National Bank',
  'Canara Bank',
  'Union Bank',
  'IDFC First Bank',
  'Kotak Mahindra Bank',
];

const compoundingOptions: CompoundingFrequency[] = ['Monthly', 'Quarterly', 'SemiAnnual', 'Annual'];

// FD Interest Accrual Display Component
function FDInterestDisplay({ fd }: { fd: FixedDeposit }) {
  const interest = useFDInterestAccrued(fd.id);
  return (
    <span className="text-sm font-semibold text-emerald-500 tabular-nums">
      +{formatCurrency(interest)}
    </span>
  );
}

export function FixedDepositsPage() {
  const { fixedDeposits, accounts, addFixedDeposit, updateFixedDeposit, closeFixedDeposit, renewFixedDeposit } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFD, setSelectedFD] = useState<FixedDeposit | null>(null);
  const [editingFD, setEditingFD] = useState<string | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    principal: '',
    interestRate: '',
    tenure: '',
    tenureUnit: 'Months' as 'Months' | 'Years',
    startDate: new Date().toISOString().split('T')[0],
    bankName: '',
    compounding: 'Quarterly' as CompoundingFrequency,
    maturityInstruction: 'AutoRenew' as 'AutoRenew' | 'Manual',
    linkedAccountId: '',
  });

  // Preview calculation
  const previewCalc = useMemo(() => {
    const principal = parseFloat(formData.principal);
    const rate = parseFloat(formData.interestRate);
    const tenure = parseFloat(formData.tenure);
    if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(rate) || rate < 0 || !Number.isFinite(tenure) || tenure <= 0) return null;

    const tenureMonths = formData.tenureUnit === 'Years' ? tenure * 12 : tenure;
    return calculateFDMaturity(principal, rate, tenureMonths, formData.compounding);
  }, [formData.principal, formData.interestRate, formData.tenure, formData.tenureUnit, formData.compounding]);

  const resetForm = () => {
    setFormData({
      principal: '',
      interestRate: '',
      tenure: '',
      tenureUnit: 'Months',
      startDate: new Date().toISOString().split('T')[0],
      bankName: '',
      compounding: 'Quarterly',
      maturityInstruction: 'AutoRenew',
      linkedAccountId: '',
    });
    setEditingFD(null);
  };

  const handleSubmit = () => {
    const principal = parseFloat(formData.principal);
    const rate = parseFloat(formData.interestRate);
    const tenure = parseFloat(formData.tenure);
    if (
      !Number.isFinite(principal) ||
      principal <= 0 ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      !Number.isFinite(tenure) ||
      tenure <= 0 ||
      !formData.bankName.trim()
    ) return;

    const tenureMonths = formData.tenureUnit === 'Years' ? tenure * 12 : tenure;
    const startDate = new Date(formData.startDate);
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

    if (editingFD) {
      updateFixedDeposit(editingFD, {
        principal,
        interestRate: rate,
        tenureMonths,
        startDate: formData.startDate,
        maturityDate: maturityDate.toISOString().split('T')[0],
        bankName: formData.bankName.trim(),
        compoundingFrequency: formData.compounding,
        maturityInstruction: formData.maturityInstruction,
        linkedAccountId: formData.linkedAccountId || undefined,
      });
    } else {
      addFixedDeposit({
        principal,
        interestRate: rate,
        tenureMonths,
        startDate: formData.startDate,
        maturityDate: maturityDate.toISOString().split('T')[0],
        bankName: formData.bankName.trim(),
        compoundingFrequency: formData.compounding,
        maturityInstruction: formData.maturityInstruction,
        linkedAccountId: formData.linkedAccountId || undefined,
        isRenewed: false,
      });
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (fd: FixedDeposit) => {
    setFormData({
      principal: fd.principal.toString(),
      interestRate: fd.interestRate.toString(),
      tenure: fd.tenureMonths >= 12 ? (fd.tenureMonths / 12).toString() : fd.tenureMonths.toString(),
      tenureUnit: fd.tenureMonths >= 12 ? 'Years' : 'Months',
      startDate: fd.startDate,
      bankName: fd.bankName,
      compounding: fd.compoundingFrequency,
      maturityInstruction: fd.maturityInstruction,
      linkedAccountId: fd.linkedAccountId || '',
    });
    setEditingFD(fd.id);
    setShowAddModal(true);
    setShowDetailModal(false);
  };

  // Summary stats
  const activeFDs = fixedDeposits.filter((fd) => fd.status === 'Active' || fd.status === 'MaturingSoon');
  const totalPrincipal = activeFDs.reduce((s, fd) => s + fd.principal, 0);
  const totalInterest = activeFDs.reduce((s, fd) => s + fd.interestEarned, 0);
  const totalMaturity = activeFDs.reduce((s, fd) => s + fd.maturityAmount, 0);

  // Chart data for selected FD
  const detailChartData = useMemo(() => {
    if (!selectedFD) return [];
    const calc = calculateFDMaturity(
      selectedFD.principal,
      selectedFD.interestRate,
      selectedFD.tenureMonths,
      selectedFD.compoundingFrequency
    );
    return calc.interestBreakdown.map((b) => ({
      period: b.period,
      interest: b.cumulativeInterest,
      balance: b.balance,
    }));
  }, [selectedFD]);

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Fixed Deposits</h1>
        <Button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          size="sm"
          className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg gap-1.5 px-3 py-1.5 h-8"
        >
          <Plus size={14} /> New FD
        </Button>
      </div>

      {/* Summary Cards */}
      {fixedDeposits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Total Principal</p>
            <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(totalPrincipal)}</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Interest Earned</p>
            <p className="text-lg font-bold text-emerald-500 tabular-nums">+{formatCurrency(totalInterest)}</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Maturity Value</p>
            <p className="text-lg font-bold text-[var(--primary)] tabular-nums">{formatCurrency(totalMaturity)}</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Active FDs</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{activeFDs.length}</p>
          </div>
        </div>
      )}

      {/* FD List */}
      {fixedDeposits.length === 0 ? (
        <EmptyState
          illustration="/empty-fd.png"
          title="No Fixed Deposits"
          description="Start tracking your FDs and watch your money grow."
          actionLabel="Create First FD"
          onAction={() => { resetForm(); setShowAddModal(true); }}
        />
      ) : (
        <div className="space-y-3">
          {fixedDeposits.map((fd) => {
            const daysRemaining = getDaysDifference(new Date().toISOString().split('T')[0], fd.maturityDate);
            const totalDays = getDaysDifference(fd.startDate, fd.maturityDate);
            const progress = totalDays > 0 ? ((totalDays - Math.max(0, daysRemaining)) / totalDays) * 100 : 100;

            return (
              <motion.div
                key={fd.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -1 }}
                className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] cursor-pointer"
                style={{
                  boxShadow: 'var(--shadow-card)',
                }}
                onClick={() => { setSelectedFD(fd); setShowDetailModal(true); }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                      <Landmark size={18} className="text-[var(--accent)]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">{fd.bankName}</h3>
                      <p className="text-xs text-[var(--text-tertiary)]">{fd.fdId}</p>
                    </div>
                  </div>
                  <StatusBadge status={fd.status} size="small" />
                </div>

                {/* Principal → Maturity */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-left">
                    <p className="text-xs text-[var(--text-tertiary)]">Principal</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatCurrency(fd.principal)}</p>
                  </div>
                  <ArrowRight size={16} className="text-[var(--text-tertiary)] flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-[var(--text-tertiary)]">Maturity</p>
                    <p className="text-sm font-semibold text-[var(--primary)] tabular-nums">{formatCurrency(fd.maturityAmount)}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-[var(--text-tertiary)]">Interest</p>
                    <FDInterestDisplay fd={fd} />
                  </div>
                </div>

                {/* Rate & Tenure */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] font-medium px-2 py-1 rounded-full">
                    {fd.interestRate}% p.a.
                  </span>
                  <span className="text-xs bg-[var(--secondary)]/10 text-[var(--secondary)] font-medium px-2 py-1 rounded-full">
                    {fd.tenureMonths} months
                  </span>
                  <span className="text-xs bg-[var(--background)] text-[var(--text-tertiary)] font-medium px-2 py-1 rounded-full">
                    {fd.compoundingFrequency}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="h-1.5 bg-[var(--background)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Matured'}
                  </span>
                  <span className="text-xs text-[var(--primary)] font-medium flex items-center gap-1">
                    View Details <ChevronRight size={14} />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                  {editingFD ? 'Edit Fixed Deposit' : 'Create Fixed Deposit'}
                </h2>

                <div className="space-y-4">
                  {/* Principal */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Principal Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.principal}
                      onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                      placeholder="e.g., 100000"
                      min="1000"
                      max="100000000"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Interest Rate (% per annum) *
                    </label>
                    <input
                      type="number"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      placeholder="e.g., 7.5"
                      min="0"
                      max="15"
                      step="0.01"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  {/* Tenure */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        Tenure *
                      </label>
                      <input
                        type="number"
                        value={formData.tenure}
                        onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                        placeholder="e.g., 12"
                        min="1"
                        max="120"
                        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        Unit
                      </label>
                      <select
                        value={formData.tenureUnit}
                        onChange={(e) => setFormData({ ...formData, tenureUnit: e.target.value as 'Months' | 'Years' })}
                        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="Months">Months</option>
                        <option value="Years">Years</option>
                      </select>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  {/* Bank Name with autocomplete */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Bank / Institution *
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="e.g., HDFC Bank"
                      list="bank-suggestions"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                    <datalist id="bank-suggestions">
                      {bankSuggestions.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  {/* Compounding */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Compounding Frequency
                    </label>
                    <select
                      value={formData.compounding}
                      onChange={(e) => setFormData({ ...formData, compounding: e.target.value as CompoundingFrequency })}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      {compoundingOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Maturity Instruction */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Maturity Instruction
                    </label>
                    <div className="flex gap-3">
                      {(['AutoRenew', 'Manual'] as const).map((mi) => (
                        <button
                          key={mi}
                          onClick={() => setFormData({ ...formData, maturityInstruction: mi })}
                          className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                            formData.maturityInstruction === mi
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)]'
                          }`}
                        >
                          {mi === 'AutoRenew' ? 'Auto Renew' : 'Manual'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Linked Account */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Linked Account (Optional)
                    </label>
                    <select
                      value={formData.linkedAccountId}
                      onChange={(e) => setFormData({ ...formData, linkedAccountId: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">None</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.bankName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {previewCalc && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-5 p-4 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/20"
                  >
                    <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-2">
                      Maturity Preview
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Maturity Amount:</span>
                      <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(previewCalc.maturityAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-[var(--text-secondary)]">Interest Earned:</span>
                      <span className="font-semibold text-emerald-500 tabular-nums">
                        +{formatCurrency(previewCalc.interestEarned)}
                      </span>
                    </div>
                    {previewCalc.tdsAmount > 0 && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-[var(--text-secondary)]">TDS (10%):</span>
                        <span className="font-semibold text-red-500 tabular-nums">
                          -{formatCurrency(previewCalc.tdsAmount)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 rounded-xl border-[var(--border)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.principal || !formData.interestRate || !formData.tenure || !formData.bankName.trim()}
                    className="flex-1 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
                  >
                    {editingFD ? 'Update FD' : 'Create FD'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedFD && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedFD.bankName}</h2>
                    <p className="text-sm text-[var(--text-tertiary)]">{selectedFD.fdId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedFD.status !== 'Closed' && (
                      <button
                        onClick={() => handleEdit(selectedFD)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--background)]"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--background)]"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <StatusBadge status={selectedFD.status} className="mb-4" />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[var(--background)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Principal</p>
                    <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(selectedFD.principal)}</p>
                  </div>
                  <div className="bg-[var(--background)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Interest Rate</p>
                    <p className="text-base font-bold text-[var(--primary)]">{selectedFD.interestRate}%</p>
                  </div>
                  <div className="bg-[var(--background)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Tenure</p>
                    <p className="text-base font-bold text-[var(--text-primary)]">{selectedFD.tenureMonths} months</p>
                  </div>
                  <div className="bg-[var(--background)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Compounding</p>
                    <p className="text-base font-bold text-[var(--text-primary)]">{selectedFD.compoundingFrequency}</p>
                  </div>
                  <div className="bg-[var(--background)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Start Date</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(selectedFD.startDate)}</p>
                  </div>
                  <div className="bg-[var(--background)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Maturity Date</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(selectedFD.maturityDate)}</p>
                  </div>
                </div>

                {/* Interest Calculation */}
                <div className="bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary-light)]/5 rounded-xl p-4 border border-[var(--primary)]/20 mb-6">
                  <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
                    Interest Calculation
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Maturity Amount</span>
                      <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(selectedFD.maturityAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Interest Earned</span>
                      <span className="font-bold text-emerald-500 tabular-nums">+{formatCurrency(selectedFD.interestEarned)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Accrued Till Date</span>
                      <FDInterestDisplay fd={selectedFD} />
                    </div>
                    {selectedFD.tdsAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">TDS (10%)</span>
                        <span className="font-bold text-red-500 tabular-nums">-{formatCurrency(selectedFD.tdsAmount)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-3 font-mono">
                    A = P(1 + r/n)^(nt)
                  </p>
                </div>

                {/* Interest Timeline Chart */}
                {detailChartData.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                      Interest Growth Timeline
                    </p>
                    <div className="h-48 bg-[var(--background)] rounded-xl p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={detailChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="period" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v).replace('₹', '')} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--surface-elevated)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              fontSize: '12px',
                            }}
                            formatter={(value: number) => [formatCurrency(value), 'Balance']}
                          />
                          <Line type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 3 }} />
                          <Line type="monotone" dataKey="interest" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedFD.status !== 'Closed' && (
                  <div className="flex gap-3">
                    {selectedFD.status === 'Matured' && (
                      <Button
                        onClick={() => {
                          renewFixedDeposit(selectedFD.id, {
                            principal: selectedFD.maturityAmount,
                            interestRate: selectedFD.interestRate,
                            tenureMonths: selectedFD.tenureMonths,
                          });
                          setShowDetailModal(false);
                        }}
                        className="flex-1 rounded-xl bg-[var(--secondary)] hover:bg-[var(--secondary)]/90 text-white gap-2"
                      >
                        <RotateCcw size={16} /> Renew
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setCloseConfirm(selectedFD.id);
                        setShowDetailModal(false);
                      }}
                      variant="outline"
                      className="flex-1 rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                    >
                      Close / Withdraw
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Confirmation */}
      <ConfirmDialog
        isOpen={!!closeConfirm}
        title="Close Fixed Deposit"
        description="Are you sure you want to close this FD? This action cannot be undone."
        confirmLabel="Close FD"
        variant="danger"
        onConfirm={() => {
          if (closeConfirm) {
            closeFixedDeposit(closeConfirm, new Date().toISOString().split('T')[0], 0);
          }
          setCloseConfirm(null);
        }}
        onCancel={() => setCloseConfirm(null)}
      />
    </div>
  );
}
