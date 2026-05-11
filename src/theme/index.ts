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

function hexToHslTuple(hex: string): string {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === red) {
    hue = ((green - blue) / delta) % 6;
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return `${Math.round(hue * 60 + (hue < 0 ? 360 : 0))} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

// ============================================
// CSS Custom Properties Generator
// ============================================
export function generateCSSVariables(isDark: boolean): Record<string, string> {
  const c = isDark ? colors.dark : colors.light;
  const white = '#FFFFFF';
  return {
    '--background': c.background,
    '--foreground': c.textPrimary,
    '--surface': c.surface,
    '--surface-elevated': c.surfaceElevated,
    '--card': c.surface,
    '--card-foreground': c.textPrimary,
    '--popover': c.surfaceElevated,
    '--popover-foreground': c.textPrimary,
    '--primary': c.primary,
    '--primary-foreground': white,
    '--primary-light': c.primaryLight,
    '--primary-dark': c.primaryDark,
    '--secondary': c.secondary,
    '--secondary-foreground': white,
    '--accent': c.accent,
    '--accent-foreground': c.textPrimary,
    '--success': c.success,
    '--danger': c.danger,
    '--destructive': c.danger,
    '--destructive-foreground': white,
    '--muted': c.background,
    '--muted-foreground': c.textSecondary,
    '--input': c.border,
    '--ring': c.primary,
    '--text-primary': c.textPrimary,
    '--text-secondary': c.textSecondary,
    '--text-tertiary': c.textTertiary,
    '--border': c.border,
    '--border-focus': c.borderFocus,
    '--background-hsl': hexToHslTuple(c.background),
    '--foreground-hsl': hexToHslTuple(c.textPrimary),
    '--card-hsl': hexToHslTuple(c.surface),
    '--card-foreground-hsl': hexToHslTuple(c.textPrimary),
    '--popover-hsl': hexToHslTuple(c.surfaceElevated),
    '--popover-foreground-hsl': hexToHslTuple(c.textPrimary),
    '--primary-hsl': hexToHslTuple(c.primary),
    '--primary-foreground-hsl': hexToHslTuple(white),
    '--secondary-hsl': hexToHslTuple(c.secondary),
    '--secondary-foreground-hsl': hexToHslTuple(white),
    '--muted-hsl': hexToHslTuple(c.background),
    '--muted-foreground-hsl': hexToHslTuple(c.textSecondary),
    '--accent-hsl': hexToHslTuple(c.accent),
    '--accent-foreground-hsl': hexToHslTuple(c.textPrimary),
    '--destructive-hsl': hexToHslTuple(c.danger),
    '--destructive-foreground-hsl': hexToHslTuple(white),
    '--border-hsl': hexToHslTuple(c.border),
    '--input-hsl': hexToHslTuple(c.border),
    '--ring-hsl': hexToHslTuple(c.primary),
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
