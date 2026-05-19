import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  Receipt,
  Landmark,
  TrendingUp,
  Shield,
  Target,
  Calculator,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react';

const menuGroups = [
  {
    label: 'Core',
    items: [
      { path: '/accounts', label: 'Accounts', icon: Wallet, color: '#0F766E' },
      { path: '/transactions', label: 'Transactions', icon: Receipt, color: '#6366F1' },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { path: '/fixed-deposits', label: 'Fixed Deposits', icon: Landmark, color: '#F59E0B' },
      { path: '/investments', label: 'Investments', icon: TrendingUp, color: '#10B981' },
      { path: '/insurance', label: 'Insurance', icon: Shield, color: '#3B82F6' },
      { path: '/budgets', label: 'Budgets', icon: Target, color: '#EC4899' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/analytics', label: 'Analytics', icon: BarChart3, color: '#8B5CF6' },
      { path: '/calculators', label: 'Calculators', icon: Calculator, color: '#F59E0B' },
      { path: '/export', label: 'Export PDF', icon: FileText, color: '#0F766E' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings, color: '#6B7280' },
    ],
  },
];

export function MorePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4">More</h1>

      <div className="space-y-4">
        {menuGroups.map((group, gi) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
              {group.label}
            </p>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
              {group.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.1 + i * 0.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--background)] ${
                      i < group.items.length - 1 ? 'border-b border-[var(--border)]' : ''
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <Icon size={18} style={{ color: item.color }} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)] flex-1">
                      {item.label}
                    </span>
                    <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
