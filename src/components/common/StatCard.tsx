import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AmountDisplay } from './AmountDisplay';

interface StatCardProps {
  label: string;
  value: number;
  change?: number;
  icon?: LucideIcon;
  color?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color = 'var(--primary)',
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-[var(--surface)] rounded-xl p-3.5 border border-[var(--border)] ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {label}
        </span>
        {Icon && (
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={13} style={{ color }} />
          </div>
        )}
      </div>
      <AmountDisplay value={value} size="medium" />
      {change !== undefined && (
        <div className="mt-1.5 flex items-center gap-1">
          <span
            className={`text-[10px] font-medium ${
              change >= 0 ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">vs last period</span>
        </div>
      )}
    </motion.div>
  );
}
