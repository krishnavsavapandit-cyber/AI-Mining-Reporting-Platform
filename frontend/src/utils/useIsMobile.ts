import { useState, useEffect } from 'react';

/**
 * Hook to detect whether the current viewport is mobile (width <= 768px).
 * Uses window.matchMedia with change listener for optimal performance.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const updateMatches = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Initial check
    updateMatches();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
    } else {
      // Compatibility fallback for older browsers
      mediaQuery.addListener(updateMatches);
    }

    window.addEventListener('resize', updateMatches);
    window.addEventListener('orientationchange', updateMatches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatches);
      } else {
        mediaQuery.removeListener(updateMatches);
      }
      window.removeEventListener('resize', updateMatches);
      window.removeEventListener('orientationchange', updateMatches);
    };
  }, [breakpoint]);

  return isMobile;
}
