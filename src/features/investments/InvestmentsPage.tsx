import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, MoreVertical, Pencil, Trash2, Bitcoin, Building2, BarChart3 } from 'lucide-react';
import { useFinanceStore } from '@/store';
import { formatCurrency } from '@/services';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import type { InvestmentType } from '@/types';

const typeConfig: Record<InvestmentType, { icon: typeof TrendingUp; color: string; label: string }> = {
  Stock: { icon: Building2, color: '#0F766E', label: 'Stock' },
  MutualFund: { icon: BarChart3, color: '#6366F1', label: 'Mutual Fund' },
  Crypto: { icon: Bitcoin, color: '#F59E0B', label: 'Crypto' },
  Other: { icon: TrendingUp, color: '#6B7280', label: 'Other' },
};

export function InvestmentsPage() {
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInv, setEditingInv] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'Stock' as InvestmentType,
    symbol: '',
    name: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({ type: 'Stock', symbol: '', name: '', quantity: '', purchasePrice: '', currentPrice: '', purchaseDate: '', notes: '' });
    setEditingInv(null);
  };

  const handleSubmit = () => {
    const quantity = parseFloat(formData.quantity);
    const purchasePrice = parseFloat(formData.purchasePrice);
    const currentPrice = parseFloat(formData.currentPrice);
    if (
      !formData.symbol.trim() ||
      !formData.name.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(purchasePrice) ||
      purchasePrice <= 0 ||
      !Number.isFinite(currentPrice) ||
      currentPrice < 0
    ) return;

    const data = {
      type: formData.type,
      symbol: formData.symbol.trim().toUpperCase(),
      name: formData.name.trim(),
      quantity,
      purchasePrice,
      currentPrice,
      purchaseDate: formData.purchaseDate,
      notes: formData.notes.trim() || undefined,
    };

    if (editingInv) {
      updateInvestment(editingInv, data);
    } else {
      addInvestment(data);
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (inv: typeof investments[0]) => {
    setFormData({
      type: inv.type,
      symbol: inv.symbol,
      name: inv.name,
      quantity: inv.quantity.toString(),
      purchasePrice: inv.purchasePrice.toString(),
      currentPrice: inv.currentPrice.toString(),
      purchaseDate: inv.purchaseDate,
      notes: inv.notes || '',
    });
    setEditingInv(inv.id);
    setShowAddModal(true);
    setOpenMenu(null);
  };

  const totalInvested = investments.reduce((s, i) => s + i.purchasePrice * i.quantity, 0);
  const currentValue = investments.reduce((s, i) => s + i.currentPrice * i.quantity, 0);
  const totalPnL = currentValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Investments</h1>
        <Button onClick={() => { resetForm(); setShowAddModal(true); }} size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg gap-1.5 px-3 py-1.5 h-8">
          <Plus size={14} /> Add
        </Button>
      </div>

      {/* Portfolio Summary */}
      {investments.length > 0 && (
        <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl p-6 text-white mb-6">
          <p className="text-sm opacity-80 mb-1">Portfolio Value</p>
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(currentValue)}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
            <div>
              <p className="text-xs opacity-70">Invested</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(totalInvested)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">P&L</p>
              <p className={`text-sm font-semibold tabular-nums ${totalPnL >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} ({pnlPercent.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Holdings */}
      {investments.length === 0 ? (
        <EmptyState illustration="/empty-investments.png" title="No Investments" description="Track your stocks, mutual funds, and crypto." actionLabel="Add First Investment" onAction={() => { resetForm(); setShowAddModal(true); }} />
      ) : (
        <div className="space-y-3">
          {investments.map((inv, i) => {
            const config = typeConfig[inv.type];
            const Icon = config.icon;
            const invested = inv.purchasePrice * inv.quantity;
            const currentVal = inv.currentPrice * inv.quantity;
            const pnl = currentVal - invested;
            const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
                      <Icon size={18} style={{ color: config.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{inv.symbol}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">{inv.name}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--background)]">
                      <MoreVertical size={16} />
                    </button>
                    <AnimatePresence>
                      {openMenu === inv.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-36 bg-[var(--surface-elevated)] rounded-xl shadow-lg border border-[var(--border)] z-30 overflow-hidden">
                          <button onClick={() => handleEdit(inv)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--background)]"><Pencil size={14} /> Edit</button>
                          <button onClick={() => { setDeleteConfirm(inv.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-3 border-t border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Qty × Avg</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{inv.quantity} × {formatCurrency(inv.purchasePrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Current</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatCurrency(currentVal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)]">P&L</p>
                    <p className={`text-sm font-semibold tabular-nums ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnlPct.toFixed(1)}%)
                    </p>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}
              className="relative bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{editingInv ? 'Edit Investment' : 'Add Investment'}</h2>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Stock', 'MutualFund', 'Crypto', 'Other'] as InvestmentType[]).map((t) => (
                      <button key={t} onClick={() => setFormData({ ...formData, type: t })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${formData.type === t ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>
                        {typeConfig[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <InvInput label="Symbol/Ticker *" value={formData.symbol} onChange={(v) => setFormData({ ...formData, symbol: v.toUpperCase() })} placeholder="RELIANCE" />
                <InvInput label="Name *" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="Company Name" />
                <div className="grid grid-cols-2 gap-4">
                  <InvInput label="Quantity *" value={formData.quantity} onChange={(v) => setFormData({ ...formData, quantity: v })} type="number" />
                  <InvInput label="Purchase Price (₹) *" value={formData.purchasePrice} onChange={(v) => setFormData({ ...formData, purchasePrice: v })} type="number" />
                </div>
                <InvInput label="Current Price (₹) *" value={formData.currentPrice} onChange={(v) => setFormData({ ...formData, currentPrice: v })} type="number" />
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Purchase Date</label>
                  <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <InvInput label="Notes" value={formData.notes} onChange={(v) => setFormData({ ...formData, notes: v })} placeholder="Optional" />
                <div className="flex gap-3 mt-2">
                  <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 rounded-xl border-[var(--border)]">Cancel</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.symbol.trim() || !formData.name.trim() || !formData.quantity || !formData.purchasePrice || !formData.currentPrice}
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

      <ConfirmDialog isOpen={!!deleteConfirm} title="Delete Investment" description="This action cannot be undone." confirmLabel="Delete" variant="danger"
        onConfirm={() => { if (deleteConfirm) deleteInvestment(deleteConfirm); setDeleteConfirm(null); }} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}

function InvInput({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
    </div>
  );
}
