import { useEffect, useState } from 'react';

const LIGHT_THEME_COLOR = '#F8F9FA';
const DARK_THEME_COLOR = '#0A0A0A';
const DISPLAY_MODE_QUERIES = [
  '(display-mode: standalone)',
  '(display-mode: fullscreen)',
  '(display-mode: minimal-ui)',
];

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

function isRunningStandalone(): boolean {
  const standaloneNavigator = window.navigator as StandaloneNavigator;
  return (
    standaloneNavigator.standalone === true ||
    DISPLAY_MODE_QUERIES.some((query) => window.matchMedia(query).matches)
  );
}

function getThemeColorMeta(): HTMLMetaElement {
  const existingMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (existingMeta) {
    return existingMeta;
  }

  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.appendChild(meta);
  return meta;
}

function getScrollableAncestor(target: EventTarget | null): HTMLElement {
  let element = target instanceof Element ? target : null;

  while (element && element !== document.body && element !== document.documentElement) {
    const style = window.getComputedStyle(element);
    const hasScrollableOverflow = /(auto|scroll|overlay)/.test(style.overflowY);

    if (hasScrollableOverflow && element.scrollHeight > element.clientHeight) {
      return element as HTMLElement;
    }

    element = element.parentElement;
  }

  return (document.scrollingElement || document.documentElement) as HTMLElement;
}

function getScrollBounds(element: HTMLElement) {
  if (element === document.documentElement || element === document.body) {
    const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    return {
      scrollTop: window.scrollY,
      maxScrollTop: Math.max(0, scrollHeight - window.innerHeight),
    };
  }

  return {
    scrollTop: element.scrollTop,
    maxScrollTop: Math.max(0, element.scrollHeight - element.clientHeight),
  };
}

export function useNativePwaShell(isDark: boolean): void {
  const [isStandalone, setIsStandalone] = useState(() => isRunningStandalone());

  useEffect(() => {
    const themeColor = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
    getThemeColorMeta().content = themeColor;
    document.documentElement.style.setProperty('--pwa-theme-color', themeColor);
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQueries = DISPLAY_MODE_QUERIES.map((query) => window.matchMedia(query));

    const syncStandaloneMode = () => {
      const nextIsStandalone = isRunningStandalone();
      root.classList.toggle('pwa-standalone', nextIsStandalone);
      setIsStandalone(nextIsStandalone);
    };

    syncStandaloneMode();
    mediaQueries.forEach((query) => query.addEventListener('change', syncStandaloneMode));

    return () => {
      root.classList.remove('pwa-standalone');
      mediaQueries.forEach((query) => query.removeEventListener('change', syncStandaloneMode));
    };
  }, []);

  useEffect(() => {
    if (!isStandalone) {
      return;
    }

    let startY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        startY = event.touches[0].clientY;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || event.defaultPrevented) {
        return;
      }

      const currentY = event.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY === 0) {
        return;
      }

      const scrollableElement = getScrollableAncestor(event.target);
      const { scrollTop, maxScrollTop } = getScrollBounds(scrollableElement);
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop >= maxScrollTop - 1;

      if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
        event.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isStandalone]);
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return;
  }

  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL;
    const serviceWorkerUrl = `${baseUrl}sw.js`;

    navigator.serviceWorker.register(serviceWorkerUrl, { scope: baseUrl }).catch(() => {
      document.documentElement.dataset.serviceWorker = 'registration-failed';
    });
  });
}
