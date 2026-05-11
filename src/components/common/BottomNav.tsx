import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Wallet, Receipt, BarChart3, Grid3X3 } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/accounts', label: 'Accounts', icon: Wallet },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/more', label: 'More', icon: Grid3X3 },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 h-16 bg-[var(--surface)]/90 backdrop-blur-xl border-t border-[var(--border)]">
      <div className="app-bottom-nav-inner flex items-center justify-around h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center w-16 h-full transition-colors ${
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-0.5 bg-[var(--primary)] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-[var(--primary)]' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
