import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  illustration: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const normalizedIllustration = illustration.startsWith('/')
    ? `${import.meta.env.BASE_URL}${illustration.slice(1)}`
    : illustration;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <img
        src={normalizedIllustration}
        alt={title}
        className="w-28 h-28 mb-5 opacity-80"
      />
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size="sm"
          className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl px-5"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
