// ============================================
// FinanceHub - Custom Hooks
// ============================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFinanceStore } from '@/store';

// ============================================
// Animated Counter Hook
// ============================================
export function useAnimatedCounter(
  target: number,
  duration: number = 800,
  startOnMount: boolean = true
) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    startTimeRef.current = undefined;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      setDisplayValue(Math.round(target * eased * 100) / 100);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
        setIsAnimating(false);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, [target, duration]);

  useEffect(() => {
    if (startOnMount) {
      startAnimation();
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [startOnMount, startAnimation]);

  return { displayValue, isAnimating, startAnimation };
}

// ============================================
// Media Query Hook
// ============================================
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ============================================
// Is Mobile Hook
// ============================================
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 640px)');
}

// ============================================
// Scroll Position Hook
// ============================================
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handler = () => {
      setScrollY(window.scrollY);
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return { scrollY, isScrolled };
}

// ============================================
// Local Storage Hook
// ============================================
function markLocalStorageUnavailable(): void {
  document.documentElement.dataset.localStorage = 'unavailable';
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      markLocalStorageUnavailable();
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          markLocalStorageUnavailable();
        }
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}

// ============================================
// Click Outside Hook
// ============================================
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// ============================================
// Debounce Hook
// ============================================
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ============================================
// Monthly Summary Hook
// ============================================
export function useMonthlySummary(months: number = 6) {
  const getMonthlySummary = useFinanceStore((s) => s.getMonthlySummary);
  const [summary, setSummary] = useState(() => getMonthlySummary(months));

  useEffect(() => {
    setSummary(getMonthlySummary(months));
  }, [getMonthlySummary, months]);

  return summary;
}

// ============================================
// Category Summary Hook
// ============================================
export function useCategorySummary(type: 'Income' | 'Expense', month?: string) {
  const getCategorySummary = useFinanceStore((s) => s.getCategorySummary);
  return getCategorySummary(type, month);
}

// ============================================
// FD Interest Accrual Hook (with timer)
// ============================================
export function useFDInterestAccrued(fdId: string): number {
  const getFDInterestAccrued = useFinanceStore((s) => s.getFDInterestAccrued);
  const [interest, setInterest] = useState(() => getFDInterestAccrued(fdId));

  useEffect(() => {
    setInterest(getFDInterestAccrued(fdId));
    const interval = setInterval(() => {
      setInterest(getFDInterestAccrued(fdId));
    }, 30000); // Update every 30 seconds for visual effect
    return () => clearInterval(interval);
  }, [fdId, getFDInterestAccrued]);

  return interest;
}
