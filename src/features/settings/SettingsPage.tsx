import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Monitor, Bell, Download, Upload, Trash2, Shield } from 'lucide-react';
import { useFinanceStore } from '@/store';
import { useTheme } from '@/theme';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, resetAllData, exportData, importData, security, setSecurityPin, clearSecurityPin } = useFinanceStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [importError, setImportError] = useState('');
  const logoSrc = `${import.meta.env.BASE_URL}logo-icon.png`;

  const handleSetPin = async () => {
    if (pin.length !== 4) { setPinError('PIN must be 4 digits'); return; }
    if (pin !== confirmPin) { setPinError('PINs do not match'); return; }
    try {
      const saved = await setSecurityPin(pin);
      if (!saved) {
        setPinError('PIN could not be saved securely in this browser');
        return;
      }
      setShowPinSetup(false);
      setPin('');
      setConfirmPin('');
      setPinError('');
    } catch {
      setPinError('PIN could not be saved securely in this browser');
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financehub-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImportError('Backup file must be 2 MB or smaller');
      e.target.value = '';
      return;
    }
    if (file.type && file.type !== 'application/json') {
      setImportError('Backup file must be JSON');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = typeof event.target?.result === 'string' ? event.target.result : '';
      if (!content || !importData(content)) {
        setImportError('Backup file is invalid or unsupported');
      }
      e.target.value = '';
    };
    reader.onerror = () => {
      setImportError('Backup file could not be read');
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4">Settings</h1>

      {/* Appearance */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="p-4 border-b border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Appearance</p>
        </div>

        {/* Theme */}
        <div className="p-4 border-b border-[var(--border)]">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Theme</label>
          <div className="flex gap-2">
            {[
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'Auto' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-colors ${
                  theme === t.value
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)]'
                }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number Format */}
        <div className="p-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Number Format</label>
          <div className="flex gap-2">
            {(['indian', 'international'] as const).map((f) => (
              <button
                key={f}
                onClick={() => updateSettings({ numberFormat: f })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors capitalize ${
                  settings.numberFormat === f
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="p-4 border-b border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Security</p>
        </div>

        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Shield size={16} className="text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">App Lock</p>
              <p className="text-xs text-[var(--text-tertiary)]">{security.appLockEnabled ? 'PIN enabled' : 'No PIN set'}</p>
            </div>
          </div>
          <Button
            onClick={() => security.appLockEnabled ? clearSecurityPin() : setShowPinSetup(true)}
            variant="outline"
            size="sm"
            className="rounded-xl border-[var(--border)] text-xs"
          >
            {security.appLockEnabled ? 'Remove' : 'Set PIN'}
          </Button>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--secondary)]/10 flex items-center justify-center">
              <Bell size={16} className="text-[var(--secondary)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Notifications</p>
              <p className="text-xs text-[var(--text-tertiary)]">Renewal reminders & alerts</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
            className={`w-12 h-7 rounded-full transition-colors relative ${settings.notificationsEnabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${settings.notificationsEnabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="p-4 border-b border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Data</p>
        </div>

        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Download size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Export Data</p>
              <p className="text-xs text-[var(--text-tertiary)]">Download JSON backup</p>
            </div>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="rounded-xl border-[var(--border)] text-xs gap-1">
            <Download size={12} /> Export
          </Button>
        </div>

        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Upload size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Import Data</p>
              <p className="text-xs text-[var(--text-tertiary)]">Restore from JSON backup</p>
            </div>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--background)]">
              <Upload size={12} /> Import
            </span>
          </label>
        </div>
        {importError && (
          <p className="px-4 pb-3 text-xs text-red-500">{importError}</p>
        )}

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <Trash2 size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-500">Clear All Data</p>
              <p className="text-xs text-[var(--text-tertiary)]">This cannot be undone</p>
            </div>
          </div>
          <Button onClick={() => setShowClearConfirm(true)} variant="outline" size="sm" className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 text-xs">
            Clear
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="text-center py-6">
        <img src={logoSrc} alt="FinanceHub" className="w-12 h-12 mx-auto mb-3 opacity-60" />
        <p className="text-sm font-medium text-[var(--text-primary)]">FinanceHub</p>
        <p className="text-xs text-[var(--text-tertiary)]">Version 1.4.0</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Your personal finance companion</p>
      </div>

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { setShowPinSetup(false); setPin(''); setConfirmPin(''); setPinError(''); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full border border-[var(--border)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Set App Lock PIN</h3>
            <div className="space-y-3">
              <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN" className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] text-center text-sm tracking-[0.5em] focus:outline-none focus:border-[var(--primary)]" />
              <input type="password" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm PIN" className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] text-center text-sm tracking-[0.5em] focus:outline-none focus:border-[var(--primary)]" />
              {pinError && <p className="text-xs text-red-500 text-center">{pinError}</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => { setShowPinSetup(false); setPin(''); setConfirmPin(''); setPinError(''); }} className="flex-1 rounded-xl border-[var(--border)]">Cancel</Button>
              <Button onClick={handleSetPin} className="flex-1 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white">Set PIN</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog isOpen={showClearConfirm} title="Clear All Data" description="All your accounts, transactions, investments, and settings will be permanently deleted. This cannot be undone."
        confirmLabel="Clear Everything" variant="danger" onConfirm={() => { resetAllData(); setShowClearConfirm(false); }} onCancel={() => setShowClearConfirm(false)} />
    </div>
  );
}
