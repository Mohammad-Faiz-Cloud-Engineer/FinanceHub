import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useFinanceStore } from '@/store';
import { formatCurrency } from '@/services';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';

export function BudgetsPage() {
  const { budgets, categories, transactions, addBudget, updateBudget, deleteBudget } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'Monthly' as 'Weekly' | 'Monthly' | 'Yearly',
    alertThreshold: 90,
  });

  const resetForm = () => {
    setFormData({ categoryId: '', amount: '', period: 'Monthly', alertThreshold: 90 });
    setEditingBudget(null);
  };

  const handleSubmit = () => {
    const amount = parseFloat(formData.amount);
    if (!formData.categoryId || !Number.isFinite(amount) || amount <= 0) return;
    const data = {
      categoryId: formData.categoryId,
      amount,
      period: formData.period,
      alertThreshold: formData.alertThreshold,
      startDate: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
      isActive: true,
    };
    if (editingBudget) {
      updateBudget(editingBudget, data);
    } else {
      addBudget(data);
    }
    setShowAddModal(false);
    resetForm();
  };

  // Calculate spent for each budget
  const currentMonth = new Date().toISOString().slice(0, 7);
  const budgetsWithSpent = budgets.map((budget) => {
    const category = categories.find((c) => c.id === budget.categoryId);
    const spent = transactions
      .filter((t) => t.type === 'Expense' && t.category === category?.name && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
    const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return { ...budget, spent, utilization, categoryName: category?.name || 'Unknown', categoryColor: category?.color || '#6B7280' };
  });

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsWithSpent.reduce((s, b) => s + b.spent, 0);
  const overallUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Budgets</h1>
        <Button onClick={() => { resetForm(); setShowAddModal(true); }} size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg gap-1.5 px-3 py-1.5 h-8">
          <Plus size={14} /> Add Budget
        </Button>
      </div>

      {/* Overall Summary */}
      {budgets.length > 0 && (
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Monthly Budget</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">
                {formatCurrency(totalSpent)} <span className="text-sm font-normal text-[var(--text-tertiary)]">of {formatCurrency(totalBudget)}</span>
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle cx="32" cy="32" r="28" fill="none" stroke={overallUtilization >= 100 ? '#EF4444' : overallUtilization >= 80 ? '#F59E0B' : '#10B981'}
                  strokeWidth="6" strokeLinecap="round" strokeDasharray={`${Math.min(overallUtilization, 100) / 100 * 175.93} 175.93`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-[var(--text-primary)]">{Math.round(overallUtilization)}%</span>
              </div>
            </div>
          </div>
          <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${Math.min(overallUtilization, 100)}%`,
              backgroundColor: overallUtilization >= 100 ? '#EF4444' : overallUtilization >= 80 ? '#F59E0B' : '#10B981',
            }} />
          </div>
        </div>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <EmptyState illustration="/empty-budgets.png" title="No Budgets Set" description="Set spending limits for different categories." actionLabel="Set First Budget" onAction={() => { resetForm(); setShowAddModal(true); }} />
      ) : (
        <div className="space-y-3">
          {budgetsWithSpent.map((budget) => {
            const isOver = budget.utilization >= 100;
            const isWarning = budget.utilization >= budget.alertThreshold && !isOver;
            return (
              <motion.div key={budget.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.categoryColor }} />
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{budget.categoryName}</h3>
                    {(isOver || isWarning) && <AlertTriangle size={14} className={isOver ? 'text-red-500' : 'text-amber-500'} />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setFormData({ categoryId: budget.categoryId, amount: budget.amount.toString(), period: budget.period, alertThreshold: budget.alertThreshold }); setEditingBudget(budget.id); setShowAddModal(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--background)]">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm(budget.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--background)]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm tabular-nums text-[var(--text-primary)]">{formatCurrency(budget.spent)} <span className="text-[var(--text-tertiary)]">/ {formatCurrency(budget.amount)}</span></span>
                  <span className={`text-xs font-medium ${isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>{Math.round(budget.utilization)}%</span>
                </div>

                <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(budget.utilization, 100)}%` }} transition={{ duration: 0.5 }}
                    className="h-full rounded-full" style={{
                      backgroundColor: isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981',
                    }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}
              className="relative bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{editingBudget ? 'Edit Budget' : 'Set Budget'}</h2>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Category</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]">
                    <option value="">Select Category</option>
                    {categories.filter((c) => c.type === 'Expense' || c.type === 'Both').map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <BudInput label="Budget Amount (₹) *" value={formData.amount} onChange={(v) => setFormData({ ...formData, amount: v })} type="number" />
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Alert Threshold ({formData.alertThreshold}%)</label>
                  <input type="range" min={50} max={100} value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                    className="w-full accent-[var(--primary)]" />
                </div>
                <div className="flex gap-3 mt-2">
                  <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 rounded-xl border-[var(--border)]">Cancel</Button>
                  <Button onClick={handleSubmit} disabled={!formData.categoryId || !formData.amount} className="flex-1 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white">Save</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog isOpen={!!deleteConfirm} title="Delete Budget" description="This action cannot be undone." confirmLabel="Delete" variant="danger"
        onConfirm={() => { if (deleteConfirm) deleteBudget(deleteConfirm); setDeleteConfirm(null); }} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}

function BudInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
    </div>
  );
}
