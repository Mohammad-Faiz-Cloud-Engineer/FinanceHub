import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LockKeyhole } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useFinanceStore } from '@/store';
import { useTheme } from '@/theme';
import { useNativePwaShell } from '@/pwa';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/common/AppHeader';
import { BottomNav } from '@/components/common/BottomNav';
import { Dashboard } from '@/features/Dashboard';
import { AccountsPage } from '@/features/accounts/AccountsPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { FixedDepositsPage } from '@/features/fixedDeposits/FixedDepositsPage';
import { CalculatorsPage } from '@/features/calculators/CalculatorsPage';
import { InsurancePage } from '@/features/insurance/InsurancePage';
import { InvestmentsPage } from '@/features/investments/InvestmentsPage';
import { BudgetsPage } from '@/features/budgets/BudgetsPage';
import { PDFExportPage } from '@/features/pdfExport/PDFExportPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { MorePage } from '@/features/MorePage';
import './App.css';

function LockScreen() {
  const security = useFinanceStore((s) => s.security);
  const verifyPin = useFinanceStore((s) => s.verifyPin);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const lockoutEnd = security.lockoutEndTime ? new Date(security.lockoutEndTime).getTime() : 0;
  const isLockedOut = lockoutEnd > Date.now();

  const handleUnlock = async () => {
    if (isLockedOut) {
      setError('Too many failed attempts. Try again in a few minutes.');
      return;
    }
    const unlocked = await verifyPin(pin);
    if (!unlocked) {
      setPin('');
      setError('Incorrect PIN');
      return;
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center" style={{ boxShadow: 'var(--shadow-modal)' }}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
          <LockKeyhole size={22} />
        </div>
        <h1 className="mb-1 text-lg font-bold text-[var(--text-primary)]">FinanceHub Locked</h1>
        <p className="mb-5 text-sm text-[var(--text-secondary)]">Enter your PIN to continue.</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          disabled={isLockedOut}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && pin.length === 4) {
              void handleUnlock();
            }
          }}
          className="mb-3 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-center text-2xl tracking-[0.5em] text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
        />
        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
        {isLockedOut && (
          <p className="mb-3 text-xs text-red-500">Too many failed attempts. Try again shortly.</p>
        )}
        <Button
          onClick={() => void handleUnlock()}
          disabled={pin.length !== 4 || isLockedOut}
          className="w-full rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
        >
          Unlock
        </Button>
      </div>
    </div>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const initializeData = useFinanceStore((s) => s.initializeData);
  const security = useFinanceStore((s) => s.security);
  useNativePwaShell(isDark);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  if (security.appLockEnabled && security.isLocked) {
    return <LockScreen />;
  }

  return (
    <div className={`app-shell min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''}`} style={{ backgroundColor: 'var(--background)' }}>
      <AppHeader />
      <main>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/fixed-deposits" element={<FixedDepositsPage />} />
            <Route path="/calculators" element={<CalculatorsPage />} />
            <Route path="/insurance" element={<InsurancePage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/export" element={<PDFExportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <BottomNav />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
