import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useFinanceStore } from '@/store';
import { formatCurrency, maskAccountNumber } from '@/services';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import type { AccountType } from '@/types';

export function AccountsPage() {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount, setPrimaryAccount } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewDetailsAccount, setViewDetailsAccount] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: 'Savings' as AccountType,
    accountHolderName: '',
    nomineeName: '',
    ifscCode: '',
    branchName: '',
    balance: '',
  });

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountNumber: '',
      accountType: 'Savings',
      accountHolderName: '',
      nomineeName: '',
      ifscCode: '',
      branchName: '',
      balance: '',
    });
    setEditingAccount(null);
  };

  const handleSubmit = () => {
    if (!formData.bankName.trim() || !formData.accountNumber.trim() || !formData.accountHolderName.trim()) return;
    const balance = formData.balance === '' ? 0 : parseFloat(formData.balance) || 0;
    const cleanFormData = {
      ...formData,
      bankName: formData.bankName.trim(),
      accountNumber: formData.accountNumber.trim(),
      accountHolderName: formData.accountHolderName.trim(),
      nomineeName: formData.nomineeName.trim() || undefined,
      ifscCode: formData.ifscCode.trim().toUpperCase(),
      branchName: formData.branchName.trim(),
      balance,
    };

    if (editingAccount) {
      updateAccount(editingAccount, cleanFormData);
    } else {
      const colors = ['#004C8F', '#6A1B9A', '#C62828', '#2E7D32', '#E65100', '#1565C0'];
      addAccount({
        ...cleanFormData,
        currency: 'INR',
        color: colors[accounts.length % colors.length],
        isPrimary: accounts.length === 0,
      });
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (account: typeof accounts[0]) => {
    setFormData({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      accountHolderName: account.accountHolderName,
      nomineeName: account.nomineeName || '',
      ifscCode: account.ifscCode || '',
      branchName: account.branchName || '',
      balance: account.balance.toString(),
    });
    setEditingAccount(account.id);
    setShowAddModal(true);
    setOpenMenu(null);
  };

  const accountTypeColors: Record<string, string> = {
    Savings: 'bg-emerald-100 text-emerald-700',
    Current: 'bg-blue-100 text-blue-700',
    Salary: 'bg-purple-100 text-purple-700',
    NRI: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Accounts</h1>
        <Button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          size="sm"
          className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg gap-1.5 px-3 py-1.5 h-8"
        >
          <Plus size={14} /> Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          illustration="/empty-accounts.png"
          title="No Bank Accounts"
          description="Add your bank accounts to track balances and transactions."
          actionLabel="Add First Account"
          onAction={() => { resetForm(); setShowAddModal(true); }}
        />
      ) : (
        <div className="space-y-4">
          {accounts.map((account, i) => {
            const accountTxs = transactions
              .filter((t) => t.accountId === account.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3);

            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                style={{ boxShadow: 'var(--shadow-card)' }}
                onClick={() => setViewDetailsAccount(account.id)}
              >
                {/* Account Header */}
                <div className="p-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: account.color }}
                    >
                      {account.bankName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-0.5">
                        {account.bankName}
                      </h3>
                      <p className="text-[11px] text-[var(--text-tertiary)] mb-1.5">
                        {maskAccountNumber(account.accountNumber)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <AmountDisplay value={account.balance} size="small" />
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${accountTypeColors[account.accountType]}`}>
                          {account.accountType}
                        </span>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === account.id ? null : account.id); }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--background)]"
                      >
                        <MoreVertical size={14} />
                      </button>
                      <AnimatePresence>
                        {openMenu === account.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-40 bg-[var(--surface-elevated)] rounded-xl shadow-lg border border-[var(--border)] z-30 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleEdit(account)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--background)]"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            {!account.isPrimary && (
                              <button
                                onClick={() => { setPrimaryAccount(account.id); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--background)]"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => { setDeleteConfirm(account.id); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Quick Info */}
                  {(account.ifscCode || account.branchName) && (
                    <div className="flex items-center gap-2.5 mt-2 pt-2 border-t border-[var(--border)] text-[10px] text-[var(--text-tertiary)]">
                      {account.ifscCode && <span>IFSC: {account.ifscCode}</span>}
                      {account.branchName && <span>• {account.branchName}</span>}
                    </div>
                  )}

                  {/* Expand/Collapse */}
                  {accountTxs.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedAccount(expandedAccount === account.id ? null : account.id); }}
                      className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--primary)] font-medium"
                    >
                      {expandedAccount === account.id ? (
                        <>Hide Transactions <ChevronUp size={12} /></>
                      ) : (
                        <>Show Recent <ChevronDown size={12} /></>
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Transactions */}
                <AnimatePresence>
                  {expandedAccount === account.id && accountTxs.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                        {accountTxs.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                            <div>
                              <p className="text-sm text-[var(--text-primary)]">{tx.description}</p>
                              <p className="text-xs text-[var(--text-tertiary)]">{tx.category}</p>
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                tx.type === 'Income' ? 'text-emerald-500' : 'text-red-500'
                              }`}
                            >
                              {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
              <div className="p-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                  {editingAccount ? 'Edit Account' : 'Add Bank Account'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="e.g., HDFC Bank"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                      placeholder="Full name as per bank records"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Account Type
                    </label>
                    <select
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value as typeof formData.accountType })}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    >
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                      <option value="Salary">Salary</option>
                      <option value="NRI">NRI</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                        placeholder="HDFC0001234"
                        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        Opening Balance
                      </label>
                      <input
                        type="number"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                        placeholder="0"
                        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      placeholder="Optional"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Nominee Name
                    </label>
                    <input
                      type="text"
                      value={formData.nomineeName}
                      onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                      placeholder="Optional"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                </div>

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
                    disabled={!formData.bankName.trim() || !formData.accountNumber.trim() || !formData.accountHolderName.trim()}
                    className="flex-1 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
                  >
                    {editingAccount ? 'Update' : 'Save Account'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Account"
        description="This will permanently delete the account and all associated transactions. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirm) deleteAccount(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Account Details Modal */}
      <AnimatePresence>
        {viewDetailsAccount && (() => {
          const account = accounts.find(a => a.id === viewDetailsAccount);
          if (!account) return null;
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setViewDetailsAccount(null)}
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
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                      style={{ backgroundColor: account.color }}
                    >
                      {account.bankName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                        {account.bankName}
                      </h2>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${accountTypeColors[account.accountType]}`}>
                        {account.accountType} Account
                      </span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="bg-[var(--background)] rounded-xl p-4 mb-6">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Current Balance</p>
                    <AmountDisplay value={account.balance} size="large" />
                  </div>

                  {/* Account Details */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Account Holder Name</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{account.accountHolderName}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Account Number</p>
                      <p className="text-sm text-[var(--text-primary)] font-mono">{maskAccountNumber(account.accountNumber)}</p>
                    </div>

                    {account.ifscCode && (
                      <div>
                        <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">IFSC Code</p>
                        <p className="text-sm text-[var(--text-primary)] font-mono">{account.ifscCode}</p>
                      </div>
                    )}

                    {account.branchName && (
                      <div>
                        <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Branch Name</p>
                        <p className="text-sm text-[var(--text-primary)]">{account.branchName}</p>
                      </div>
                    )}

                    {account.nomineeName && (
                      <div>
                        <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Nominee Name</p>
                        <p className="text-sm text-[var(--text-primary)]">{account.nomineeName}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                      <div>
                        <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Created</p>
                        <p className="text-sm text-[var(--text-primary)]">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Last Updated</p>
                        <p className="text-sm text-[var(--text-primary)]">
                          {new Date(account.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setViewDetailsAccount(null)}
                      className="flex-1 rounded-xl border-[var(--border)]"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setViewDetailsAccount(null);
                        handleEdit(account);
                      }}
                      className="flex-1 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
                    >
                      Edit Account
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
