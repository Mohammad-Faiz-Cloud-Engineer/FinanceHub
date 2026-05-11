import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings } from 'lucide-react';
import { useFinanceStore } from '@/store';
import { useScrollPosition } from '@/hooks';
import { Link } from 'react-router-dom';

export function AppHeader() {
  const { isScrolled } = useScrollPosition();
  const { notifications, markNotificationRead, clearAllNotifications } = useFinanceStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [showNotifications, setShowNotifications] = useState(false);
  const logoSrc = `${import.meta.env.BASE_URL}logo-icon.png`;

  return (
    <>
      <header
        className={`app-header fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6 border-b transition-colors duration-200 ${
          isScrolled
            ? 'bg-[var(--surface)]/90 backdrop-blur-xl border-[var(--border)]'
            : 'bg-[var(--background)]/90 backdrop-blur-xl border-transparent'
        }`}
      >
        <Link to="/" className="flex items-center gap-3">
          <img src={logoSrc} alt="FinanceHub" className="w-8 h-8" />
          <span className="text-lg font-bold text-[var(--text-primary)] hidden sm:block">
            FinanceHub
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <Link
            to="/settings"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors"
          >
            <Settings size={20} />
          </Link>
        </div>
      </header>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="app-notification-panel fixed top-16 right-[20px] z-50 w-80 max-h-[400px] bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Notifications
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[320px]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--background)] transition-colors ${
                        !n.isRead ? 'bg-[var(--primary)]/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {n.title}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
