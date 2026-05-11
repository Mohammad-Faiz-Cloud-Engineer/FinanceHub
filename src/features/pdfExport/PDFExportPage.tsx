import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye } from 'lucide-react';
import { useFinanceStore } from '@/store';
import { formatCurrency, formatDate, maskAccountNumber } from '@/services';
import { Button } from '@/components/ui/button';

export function PDFExportPage() {
  const { accounts, transactions } = useFinanceStore();
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [showPreview, setShowPreview] = useState(false);

  const presets: Record<string, { start: string; end: string; label: string }> = {
    thisMonth: { start: new Date().toISOString().slice(0, 7) + '-01', end: new Date().toISOString().split('T')[0], label: 'This Month' },
    lastMonth: { start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10), end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10), label: 'Last Month' },
    last3Months: { start: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().slice(0, 10), end: new Date().toISOString().split('T')[0], label: 'Last 3 Months' },
    thisYear: { start: new Date().getFullYear() + '-01-01', end: new Date().toISOString().split('T')[0], label: 'This Year' },
  };

  const account = accounts.find((a) => a.id === selectedAccount);
  const range = presets[dateRange];

  const filteredTxs = transactions
    .filter((t) => t.accountId === selectedAccount && t.date >= range.start && t.date <= range.end)
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalCredit = filteredTxs.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const totalDebit = filteredTxs.filter((t) => t.type === 'Expense' || t.type === 'Transfer').reduce((s, t) => s + t.amount, 0);
  const openingBalance = (account?.balance || 0) - (totalCredit - totalDebit);
  const escapeHtml = (value: string): string =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.opener = null;

    const accountBankName = escapeHtml(account?.bankName || 'Bank Statement');
    const accountNumber = escapeHtml(maskAccountNumber(account?.accountNumber || ''));
    const accountType = escapeHtml(account?.accountType || 'Savings');
    const ifscCode = escapeHtml(account?.ifscCode || 'N/A');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bank Statement - ${accountBankName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0F766E; }
          .header h1 { font-size: 24px; color: #0F766E; margin-bottom: 8px; }
          .header p { color: #666; font-size: 13px; }
          .account-info { display: flex; justify-content: space-between; margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .account-info div p:first-child { font-size: 11px; color: #999; text-transform: uppercase; }
          .account-info div p:last-child { font-size: 14px; font-weight: 600; color: #333; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 25px; padding: 15px; background: #f0fdfa; border-radius: 8px; border: 1px solid #ccfbf1; }
          .summary div { text-align: center; }
          .summary div p:first-child { font-size: 11px; color: #0F766E; text-transform: uppercase; }
          .summary div p:last-child { font-size: 18px; font-weight: 700; color: #0F766E; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f8f9fa; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb; }
          td { padding: 10px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
          .credit { color: #10B981; }
          .debit { color: #EF4444; }
          .balance { font-weight: 600; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; padding-top: 15px; border-top: 1px solid #e5e7eb; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${accountBankName}</h1>
          <p>Account Statement for the period ${formatDate(range.start)} to ${formatDate(range.end)}</p>
        </div>

        <div class="account-info">
          <div>
            <p>Account Holder</p>
            <p>Account User</p>
          </div>
          <div>
            <p>Account Number</p>
            <p>${accountNumber}</p>
          </div>
          <div>
            <p>Account Type</p>
            <p>${accountType}</p>
          </div>
          <div>
            <p>IFSC Code</p>
            <p>${ifscCode}</p>
          </div>
        </div>

        <div class="summary">
          <div>
            <p>Opening Balance</p>
            <p>₹${openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p>Total Credit</p>
            <p>₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p>Total Debit</p>
            <p>₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p>Closing Balance</p>
            <p>₹${(account?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th style="text-align:right">Debit (₹)</th>
              <th style="text-align:right">Credit (₹)</th>
              <th style="text-align:right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTxs.map((tx) => `
              <tr>
                <td>${formatDate(tx.date)}</td>
                <td>${escapeHtml(tx.description)}</td>
                <td>${escapeHtml(tx.category)}</td>
                <td style="text-align:right" class="${tx.type !== 'Income' ? 'debit' : ''}">${tx.type !== 'Income' ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                <td style="text-align:right" class="${tx.type === 'Income' ? 'credit' : ''}">${tx.type === 'Income' ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                <td style="text-align:right" class="balance">${(tx.runningBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated statement and does not require signature.</p>
          <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>

        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 24px; background:#0F766E; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1.5">Export Statements</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Generate bank-grade PDF statements</p>

      <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] space-y-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Account Select */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Select Account</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.bankName} - {maskAccountNumber(a.accountNumber)}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Statement Period</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  dateRange === key
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {account && (
          <div className="bg-[var(--background)] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Transactions</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{filteredTxs.length}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Period</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{formatDate(range.start)} - {formatDate(range.end)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Total Credit</p>
                <p className="text-sm font-semibold text-emerald-500 tabular-nums">+{formatCurrency(totalCredit)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Total Debit</p>
                <p className="text-sm font-semibold text-red-500 tabular-nums">-{formatCurrency(totalDebit)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => setShowPreview(!showPreview)} variant="outline" className="flex-1 rounded-xl border-[var(--border)] gap-2">
            <Eye size={16} /> {showPreview ? 'Hide' : 'Preview'}
          </Button>
          <Button onClick={generatePDF} className="flex-1 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white gap-2">
            <Download size={16} /> Generate PDF
          </Button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white rounded-2xl p-6 border border-gray-200 text-gray-900">
          <div className="text-center mb-6 pb-4 border-b-2 border-[#0F766E]">
            <h2 className="text-xl font-bold text-[#0F766E]">{account?.bankName || 'Bank Statement'}</h2>
            <p className="text-xs text-gray-500 mt-1">Account Statement</p>
            <p className="text-xs text-gray-500">{formatDate(range.start)} to {formatDate(range.end)}</p>
          </div>

          <div className="flex justify-between text-xs mb-4 p-3 bg-gray-50 rounded-lg">
            <div><p className="text-gray-400 uppercase">Account</p><p className="font-semibold">{maskAccountNumber(account?.accountNumber || '')}</p></div>
            <div><p className="text-gray-400 uppercase">Type</p><p className="font-semibold">{account?.accountType}</p></div>
            <div><p className="text-gray-400 uppercase">IFSC</p><p className="font-semibold">{account?.ifscCode}</p></div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Description</th>
                <th className="text-right p-2">Debit</th>
                <th className="text-right p-2">Credit</th>
                <th className="text-right p-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.slice(0, 20).map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100">
                  <td className="p-2">{formatDate(tx.date)}</td>
                  <td className="p-2">{tx.description}</td>
                  <td className="p-2 text-right text-red-500">{tx.type !== 'Income' ? formatCurrency(tx.amount) : '-'}</td>
                  <td className="p-2 text-right text-emerald-500">{tx.type === 'Income' ? formatCurrency(tx.amount) : '-'}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(tx.runningBalance || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTxs.length > 20 && (
            <p className="text-center text-xs text-gray-400 mt-4">... and {filteredTxs.length - 20} more transactions</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
