import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Shield, Heart, Car, Home, HelpCircle, MoreVertical, Pencil, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useFinanceStore } from '@/store';
import { formatCurrency, formatDate, getDaysDifference } from '@/services';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import type { InsuranceType } from '@/types';

const typeConfig: Record<InsuranceType, { icon: typeof Shield; color: string; label: string }> = {
  Life: { icon: Heart, color: '#EC4899', label: 'Life' },
  Health: { icon: Shield, color: '#10B981', label: 'Health' },
  Vehicle: { icon: Car, color: '#3B82F6', label: 'Vehicle' },
  Home: { icon: Home, color: '#F59E0B', label: 'Home' },
  Other: { icon: HelpCircle, color: '#6B7280', label: 'Other' },
};

const typeOptions: InsuranceType[] = ['Life', 'Health', 'Vehicle', 'Home', 'Other'];
const frequencyOptions = ['Monthly', 'Quarterly', 'Annual'];

export function InsurancePage() {
  const { insurance, addInsurance, updateInsurance, deleteInsurance, renewInsurance } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIns, setEditingIns] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'Health' as InsuranceType,
    provider: '',
    policyNumber: '',
    sumInsured: '',
    premiumAmount: '',
    premiumFrequency: 'Annual',
    startDate: '',
    renewalDate: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'Health',
      provider: '',
      policyNumber: '',
      sumInsured: '',
      premiumAmount: '',
      premiumFrequency: 'Annual',
      startDate: '',
      renewalDate: '',
      notes: '',
    });
    setEditingIns(null);
  };

  const handleSubmit = () => {
    const premiumAmount = parseFloat(formData.premiumAmount);
    const sumInsured = parseFloat(formData.sumInsured);
    if (
      !formData.provider.trim() ||
      !formData.policyNumber.trim() ||
      !Number.isFinite(premiumAmount) ||
      premiumAmount <= 0 ||
      !formData.renewalDate
    ) return;

    const data = {
      type: formData.type,
      provider: formData.provider.trim(),
      policyNumber: formData.policyNumber.trim(),
      sumInsured: Number.isFinite(sumInsured) ? Math.max(0, sumInsured) : 0,
      premiumAmount,
      premiumFrequency: formData.premiumFrequency as 'Monthly' | 'Quarterly' | 'Annual',
      startDate: formData.startDate,
      renewalDate: formData.renewalDate,
      notes: formData.notes.trim() || undefined,
      isActive: true,
    };

    if (editingIns) {
      updateInsurance(editingIns, data);
    } else {
      addInsurance(data);
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (ins: typeof insurance[0]) => {
    setFormData({
      type: ins.type,
      provider: ins.provider,
      policyNumber: ins.policyNumber,
      sumInsured: ins.sumInsured.toString(),
      premiumAmount: ins.premiumAmount.toString(),
      premiumFrequency: ins.premiumFrequency,
      startDate: ins.startDate,
      renewalDate: ins.renewalDate,
      notes: ins.notes || '',
    });
    setEditingIns(ins.id);
    setShowAddModal(true);
    setOpenMenu(null);
  };

  const totalPremium = insurance.reduce((s, ins) => {
    const multiplier = ins.premiumFrequency === 'Monthly' ? 12 : ins.premiumFrequency === 'Quarterly' ? 4 : 1;
    return s + ins.premiumAmount * multiplier;
  }, 0);

  const upcomingRenewals = insurance.filter((ins) => {
    const days = getDaysDifference(new Date().toISOString().split('T')[0], ins.renewalDate);
    return days <= 30 && days > 0 && ins.isActive;
  });

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Insurance</h1>
        <Button onClick={() => { resetForm(); setShowAddModal(true); }} size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg gap-1.5 px-3 py-1.5 h-8">
          <Plus size={14} /> Add Policy
        </Button>
      </div>

      {/* Summary */}
      {insurance.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Annual Premium</p>
            <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(totalPremium)}</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Active Policies</p>
            <p className="text-lg font-bold text-[var(--primary)]">{insurance.filter((i) => i.isActive).length}</p>
          </div>
        </div>
      )}

      {/* Upcoming Renewals */}
      {upcomingRenewals.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-200 dark:border-amber-800 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Upcoming Renewals</p>
          </div>
          {upcomingRenewals.map((ins) => {
            const daysLeft = getDaysDifference(new Date().toISOString().split('T')[0], ins.renewalDate);
            return (
              <div key={ins.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--text-primary)]">{ins.provider} - {ins.type}</span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{daysLeft} days left</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Policy List */}
      {insurance.length === 0 ? (
        <EmptyState
          illustration="/empty-insurance.png"
          title="No Insurance Policies"
          description="Track your insurance policies and renewal dates."
          actionLabel="Add First Policy"
          onAction={() => { resetForm(); setShowAddModal(true); }}
        />
      ) : (
        <div className="space-y-3">
          {insurance.map((ins, i) => {
            const config = typeConfig[ins.type];
            const Icon = config.icon;
            const daysLeft = getDaysDifference(new Date().toISOString().split('T')[0], ins.renewalDate);
            const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;

            return (
              <motion.div
                key={ins.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      <Icon size={18} style={{ color: config.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{ins.provider}</h3>
                      <p className="text-xs text-[var(--text-tertiary)]">****{ins.policyNumber.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === ins.id ? null : ins.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--background)]"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <AnimatePresence>
                      {openMenu === ins.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-36 bg-[var(--surface-elevated)] rounded-xl shadow-lg border border-[var(--border)] z-30 overflow-hidden"
                        >
                          <button onClick={() => handleEdit(ins)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--background)]">
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              const newDate = new Date(ins.renewalDate);
                              newDate.setFullYear(newDate.getFullYear() + 1);
                              renewInsurance(ins.id, newDate.toISOString().split('T')[0]);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--background)]"
                          >
                            <Clock size={14} /> Renew
                          </button>
                          <button onClick={() => { setDeleteConfirm(ins.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                            <Trash2 size={14} /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                    {ins.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ins.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                    {ins.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {isExpiringSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                      Renews in {daysLeft}d
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-3 border-t border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Sum Insured</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatCurrency(ins.sumInsured)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Premium</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatCurrency(ins.premiumAmount)}/{ins.premiumFrequency === 'Monthly' ? 'mo' : ins.premiumFrequency === 'Quarterly' ? 'qtr' : 'yr'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Renews</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{formatDate(ins.renewalDate)}</p>
                  </div>
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
              className="relative bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  {editingIns ? 'Edit Policy' : 'Add Insurance Policy'}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Policy Type</label>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map((t) => {
                      return (
                        <button
                          key={t}
                          onClick={() => setFormData({ ...formData, type: t })}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                            formData.type === t
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Input label="Provider *" value={formData.provider} onChange={(v) => setFormData({ ...formData, provider: v })} placeholder="e.g., LIC" />
                <Input label="Policy Number *" value={formData.policyNumber} onChange={(v) => setFormData({ ...formData, policyNumber: v })} placeholder="Enter policy number" />

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Sum Insured (₹)" value={formData.sumInsured} onChange={(v) => setFormData({ ...formData, sumInsured: v })} type="number" />
                  <Input label="Premium Amount (₹) *" value={formData.premiumAmount} onChange={(v) => setFormData({ ...formData, premiumAmount: v })} type="number" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Premium Frequency</label>
                  <select
                    value={formData.premiumFrequency}
                    onChange={(e) => setFormData({ ...formData, premiumFrequency: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    {frequencyOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Start Date</label>
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Renewal Date *</label>
                    <input type="date" value={formData.renewalDate} onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional" rows={2} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] resize-none" />
                </div>

                <div className="flex gap-3 mt-2">
                  <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 rounded-xl border-[var(--border)]">Cancel</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.provider.trim() || !formData.policyNumber.trim() || !formData.premiumAmount || !formData.renewalDate}
                    className="flex-1 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog isOpen={!!deleteConfirm} title="Delete Policy" description="This action cannot be undone." confirmLabel="Delete" variant="danger"
        onConfirm={() => { if (deleteConfirm) deleteInsurance(deleteConfirm); setDeleteConfirm(null); }} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
    </div>
  );
}
