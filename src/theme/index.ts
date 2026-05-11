// ============================================
// FinanceHub - Theme System
// ============================================
import { useEffect, useState } from 'react';
import { useFinanceStore } from '@/store';
import type { ThemeMode } from '@/types';

// ============================================
// Theme Colors
// ============================================
export const colors = {
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    primary: '#0F766E',
    primaryLight: '#14B8A6',
    primaryDark: '#0D5B56',
    secondary: '#6366F1',
    accent: '#F59E0B',
    success: '#10B981',
    danger: '#EF4444',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderFocus: '#0F766E',
  },
  dark: {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceElevated: '#1C1C1C',
    primary: '#14B8A6',
    primaryLight: '#2DD4BF',
    primaryDark: '#0F766E',
    secondary: '#818CF8',
    accent: '#FBBF24',
    success: '#34D399',
    danger: '#F87171',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#262626',
    borderFocus: '#14B8A6',
  },
};

// ============================================
// Status Colors (Universal)
// ============================================
export const statusColors = {
  Active: '#10B981',
  MaturingSoon: '#F59E0B',
  Matured: '#3B82F6',
  Closed: '#6B7280',
  safe: '#10B981',
  caution: '#F59E0B',
  warning: '#F59E0B',
  over: '#EF4444',
};

// ============================================
// Shadow Tokens
// ============================================
export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  elevated: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  modal: '0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)',
  buttonHover: '0 4px 12px rgba(15,118,110,0.25)',
};

// ============================================
// CSS Custom Properties Generator
// ============================================
export function generateCSSVariables(isDark: boolean): Record<string, string> {
  const c = isDark ? colors.dark : colors.light;
  return {
    '--background': c.background,
    '--surface': c.surface,
    '--surface-elevated': c.surfaceElevated,
    '--primary': c.primary,
    '--primary-light': c.primaryLight,
    '--primary-dark': c.primaryDark,
    '--secondary': c.secondary,
    '--accent': c.accent,
    '--success': c.success,
    '--danger': c.danger,
    '--text-primary': c.textPrimary,
    '--text-secondary': c.textSecondary,
    '--text-tertiary': c.textTertiary,
    '--border': c.border,
    '--border-focus': c.borderFocus,
    '--shadow-card': shadows.card,
    '--shadow-elevated': shadows.elevated,
    '--shadow-modal': shadows.modal,
  };
}

// ============================================
// Theme Hook
// ============================================
export function useTheme() {
  const { settings, updateSettings } = useFinanceStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDark = settings.theme === 'system' ? systemTheme === 'dark' : settings.theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    const vars = generateCSSVariables(isDark);
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return {
    isDark,
    theme: settings.theme,
    setTheme: (theme: ThemeMode) => updateSettings({ theme }),
    colors: isDark ? colors.dark : colors.light,
    shadows,
    statusColors,
  };
}

// ============================================
// Tailwind Dark Mode Classes Helper
// ============================================
export function getThemeClasses(lightClass: string, darkClass: string): string {
  return `${lightClass} dark:${darkClass}`;
}
