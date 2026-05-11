import { useAnimatedCounter } from '@/hooks';
import { formatCurrencyFull } from '@/services';
import { useFinanceStore } from '@/store';

interface AmountDisplayProps {
  value: number;
  currency?: string;
  size?: 'small' | 'medium' | 'large';
  showSign?: boolean;
  animated?: boolean;
  className?: string;
}

export function AmountDisplay({
  value,
  currency,
  size = 'medium',
  showSign = false,
  animated = true,
  className = '',
}: AmountDisplayProps) {
  const { settings } = useFinanceStore();
  const { displayValue } = useAnimatedCounter(animated ? value : 0, 800, animated);

  const displayAmount = animated ? displayValue : value;
  const isPositive = value >= 0;
  const formatted = formatCurrencyFull(
    showSign ? Math.abs(displayAmount) : displayAmount,
    currency || settings.currency,
    settings.numberFormat
  );

  const sign = showSign ? (isPositive ? '+' : '-') : '';

  const sizeClasses = {
    small: 'text-xs font-semibold',
    medium: 'text-lg font-semibold',
    large: 'text-2xl font-bold tracking-tight',
  };

  const colorClass =
    showSign && value !== 0
      ? isPositive
        ? 'text-emerald-500'
        : 'text-red-500'
      : 'text-[var(--text-primary)]';

  return (
    <span
      className={`tabular-nums ${sizeClasses[size]} ${colorClass} ${className}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {sign}
      {formatted}
    </span>
  );
}
