import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Filter, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { useFinanceStore } from '@/store';
import { useDebounce } from '@/hooks';
import { formatCurrency, formatDateRelative } from '@/services';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import type { TransactionType } from '@/types';

const filterTypes: { label: string; value: TransactionType | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Income', value: 'Income' },
  { label: 'Expense', value: 'Expense' },
  { label: 'Transfer', value: 'Transfer' },
];

export function TransactionsPage() {
  const {
    transactions,
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transactionFilters,
    setTransactionFilters,
  } = useFinanceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Form state
  const [formData, setFormData] = useState({
    type: 'Expense' as TransactionType,
    amount: '',
    description: '',
    accountId: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    notes: '',
    toAccountId: '',
  });

  // Update filters when search changes
  useEffect(() => {
    setTransactionFilters({ search: debouncedSearch });
  }, [debouncedSearch, setTransactionFilters]);

  const resetForm = () => {
    setFormData({
      type: 'Expense',
      amount: '',
      description: '',
      accountId: accounts[0]?.id || '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      tags: '',
      notes: '',
      toAccountId: '',
    });
    setEditingTx(null);
  };

  const transactionTouchesAccount = (tx: typeof transactions[number], accountId: string) =>
    tx.accountId === accountId || tx.toAccountId === accountId;

  const handleSubmit = () => {
    const amount = parseFloat(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !formData.description.trim() || !formData.accountId || !formData.category) return;
    if (formData.type === 'Transfer' && (!formData.toAccountId || formData.toAccountId === formData.accountId)) return;

    const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingTx) {
      updateTransaction(editingTx, {
        type: formData.type,
        amount,
        description: formData.description.trim(),
        accountId: formData.accountId,
        category: formData.category,
        date: formData.date,
        tags,
        notes: formData.notes || undefined,
        toAccountId: formData.type === 'Transfer' ? formData.toAccountId || undefined : undefined,
      });
    } else {
      addTransaction({
        accountId: formData.accountId,
        type: formData.type,
        amount,
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date,
        tags,
        isRecurring: false,
        notes: formData.notes || undefined,
        toAccountId: formData.type === 'Transfer' ? formData.toAccountId || undefined : undefined,
      });
    }
    setShowAddModal(false);
    resetForm();
  };

  // Get filtered transactions
  let filteredTxs = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (transactionFilters.type && transactionFilters.type !== 'All') {
    filteredTxs = filteredTxs.filter((t) => t.type === transactionFilters.type);
  }
  if (transactionFilters.search) {
    const q = transactionFilters.search.toLowerCase();
    filteredTxs = filteredTxs.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }
  if (transactionFilters.category) {
    filteredTxs = filteredTxs.filter((t) => t.category === transactionFilters.category);
  }
  if (transactionFilters.account) {
    filteredTxs = filteredTxs.filter((t) => transactionTouchesAccount(t, transactionFilters.account!));
  }

  // Group by date
  const grouped: Record<string, typeof filteredTxs> = {};
  filteredTxs.forEach((tx) => {
    const dateKey = tx.date;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(tx);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const incomeCategories = categories.filter((c) => c.type === 'Income' || c.type === 'Both');
  const expenseCategories = categories.filter((c) => c.type === 'Expense' || c.type === 'Both');

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Transactions</h1>
        <Button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          size="sm"
          className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg gap-1.5 px-3 py-1.5 h-8"
        >
          <Plus size={14} /> Add
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setTransactionFilters({ search: e.target.value });
          }}
          placeholder="Search transactions..."
          className="w-full h-10 pl-9 pr-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setTransactionFilters({ search: '' }); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="relative mb-3">
        {/* fade hint on the right so users know it's scrollable */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[var(--background)] to-transparent z-10" />
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
        {filterTypes.map((ft) => (
          <button
            key={ft.value}
            onClick={() => setTransactionFilters({ type: ft.value })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              transactionFilters.type === ft.value
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--background)]'
            }`}
          >
            {ft.label}
          </button>
        ))}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--background)] flex items-center gap-1"
        >
          <Filter size={12} /> More
        </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] space-y-2.5">
              <div>
                <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Account</label>
                <select
                  value={transactionFilters.account || ''}
                  onChange={(e) => setTransactionFilters({ account: e.target.value || undefined })}
                  className="w-full h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text-primary)]"
                >
                  <option value="">All Accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.bankName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Category</label>
                <select
                  value={transactionFilters.category || ''}
                  onChange={(e) => setTransactionFilters({ category: e.target.value || undefined })}
                  className="w-full h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text-primary)]"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction List */}
      {filteredTxs.length === 0 ? (
        <EmptyState
          illustration="/empty-transactions.png"
          title={searchQuery ? 'No Results Found' : 'No Transactions'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters.'
              : 'Start recording your income and expenses.'
          }
          actionLabel={!searchQuery ? 'Add Transaction' : undefined}
          onAction={!searchQuery ? () => { resetForm(); setShowAddModal(true); } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="sticky top-16 z-10 bg-[var(--background)]/80 backdrop-blur-sm py-2 px-1">
                <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  {formatDateRelative(date)}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] ml-2">
                  • {formatCurrency(grouped[date].reduce((s, t) => s + (t.type === 'Income' ? -t.amount : t.amount), 0))}
                </span>
              </div>
              <div className="space-y-1">
                {grouped[date].map((tx) => {
                  const account = accounts.find((a) => a.id === tx.accountId);
                  const category = categories.find((c) => c.name === tx.category);
                  return (
                    <motion.div
                      key={tx.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] flex items-center gap-4 cursor-pointer hover:bg-[var(--background)] transition-colors"
                      onClick={() => {
                        setEditingTx(tx.id);
                        setFormData({
                          type: tx.type,
                          amount: tx.amount.toString(),
                          description: tx.description,
                          accountId: tx.accountId,
                          category: tx.category,
                          date: tx.date,
                          tags: tx.tags.join(', '),
                          notes: tx.notes || '',
                          toAccountId: tx.toAccountId || '',
                        });
                        setShowAddModal(true);
                      }}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          tx.type === 'Income'
                            ? 'bg-emerald-100 text-emerald-600'
                            : tx.type === 'Expense'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {tx.type === 'Income' ? (
                          <ArrowUpRight size={18} />
                        ) : tx.type === 'Expense' ? (
                          <ArrowDownRight size={18} />
                        ) : (
                          <ArrowLeftRight size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${category?.color || '#6B7280'}15`,
                              color: category?.color || '#6B7280',
                            }}
                          >
                            {tx.category}
                          </span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            {account?.bankName}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
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
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
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
                  {editingTx ? 'Edit Transaction' : 'Add Transaction'}
                </h2>

                {/* Type Toggle */}
                <div className="flex bg-[var(--background)] rounded-xl p-1 mb-5">
                  {(['Expense', 'Income', 'Transfer'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormData({ ...formData, type: t })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.type === t
                          ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm'
                          : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[var(--text-tertiary)]">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full h-14 pl-10 pr-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-2xl font-bold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What was this for?"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  {/* Account */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Account *
                    </label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">Select Account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.bankName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Category *
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {(formData.type === 'Income' ? incomeCategories : expenseCategories).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setFormData({ ...formData, category: cat.name })}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            formData.category === cat.name
                              ? 'text-white'
                              : 'bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border)]'
                          }`}
                          style={
                            formData.category === cat.name
                              ? { backgroundColor: cat.color }
                              : {}
                          }
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transfer To */}
                  {formData.type === 'Transfer' && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        To Account
                      </label>
                      <select
                        value={formData.toAccountId}
                        onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="">Select Destination</option>
                        {accounts
                          .filter((a) => a.id !== formData.accountId)
                          .map((a) => (
                            <option key={a.id} value={a.id}>{a.bankName}</option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="e.g., business, tax-deductible"
                      className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional notes..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {editingTx && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteConfirm(editingTx);
                        setShowAddModal(false);
                      }}
                      className="rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 rounded-xl border-[var(--border)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !formData.amount ||
                      !formData.description.trim() ||
                      !formData.accountId ||
                      !formData.category ||
                      (formData.type === 'Transfer' && (!formData.toAccountId || formData.toAccountId === formData.accountId))
                    }
                    className="flex-1 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
                  >
                    {editingTx ? 'Update' : 'Save'}
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
        title="Delete Transaction"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirm) deleteTransaction(deleteConfirm);
          setDeleteConfirm(null);
          resetForm();
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
