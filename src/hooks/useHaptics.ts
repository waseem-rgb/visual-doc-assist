import { useCallback } from 'react';

export function useHaptics() {
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    try {
      // Fallback to web vibration API
      if ('vibrate' in navigator) {
        return (navigator as any).vibrate(pattern);
      }
      
      return false;
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
      return false;
    }
  }, []);

  const lightImpact = useCallback(() => vibrate(50), [vibrate]);
  const mediumImpact = useCallback(() => vibrate(100), [vibrate]);
  const heavyImpact = useCallback(() => vibrate([100, 50, 100]), [vibrate]);

  return {
    vibrate,
    lightImpact,
    mediumImpact,
    heavyImpact,
  };
}