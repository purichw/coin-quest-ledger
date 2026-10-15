import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

// Keep a pending write on its form. If another navigation action nevertheless
// removes or covers that form, its completion must not pop the current screen.
export function useSaveNavigation(busy: boolean) {
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; };
  }, []));
  const finish = useCallback((navigate: () => void) => {
    if (focused.current) navigate();
  }, []);
  return { options: { gestureEnabled: !busy, headerBackVisible: !busy }, finish };
}
