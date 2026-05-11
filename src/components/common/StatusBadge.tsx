import { CheckCircle, Clock, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'default';
  className?: string;
}

const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
  Active: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle, label: 'Active' },
  MaturingSoon: { color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock, label: 'Maturing Soon' },
  Matured: { color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle, label: 'Matured' },
  Closed: { color: 'text-gray-700', bg: 'bg-gray-100', icon: XCircle, label: 'Closed' },
  safe: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle, label: 'On Track' },
  caution: { color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock, label: 'Caution' },
  warning: { color: 'text-amber-700', bg: 'bg-amber-100', icon: AlertTriangle, label: 'Warning' },
  over: { color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle, label: 'Over Budget' },
  pending: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock, label: 'Pending' },
};

export function StatusBadge({ status, size = 'default', className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    icon: HelpCircle,
    label: status,
  };

  const Icon = config.icon;
  const sizeClasses =
    size === 'small'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.color} ${config.bg} ${sizeClasses} ${className}`}
    >
      <Icon size={size === 'small' ? 10 : 12} />
      {config.label}
    </span>
  );
}
