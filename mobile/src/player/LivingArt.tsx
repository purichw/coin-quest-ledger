import { useEffect, useState, type ReactNode } from 'react';
import { useIsFocused } from 'expo-router';
import { AccessibilityInfo, Animated, AppState, Easing, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

// Stay still until the accessibility preference is known. Tabs keep their
// screens mounted, so focus and app activity both govern native-driver loops.
export function useMotionAllowed() {
  const focused = useIsFocused();
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    let mounted = true; let preferenceChanged = false;
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { preferenceChanged = true; setReduced(value); });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted && !preferenceChanged) setReduced(value); }).catch(() => { /* Keep the static fallback. */ });
    const app = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  return focused && active && !reduced;
}

type LivingArtProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  kind?: 'portrait' | 'dragon' | 'seal';
  repeat?: boolean;
};

export function LivingArt({ children, style, kind = 'portrait', repeat = true }: LivingArtProps) {
  const allowed = useMotionAllowed();
  const [paused, setPaused] = useState(false);
  const [phase] = useState(() => new Animated.Value(0));
  useEffect(() => {
    phase.stopAnimation(); phase.setValue(0);
    if (!allowed || paused) return;
    const cycle = Animated.loop(Animated.sequence([
      Animated.timing(phase, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(phase, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]), { iterations: repeat ? -1 : 1 });
    cycle.start();
    return () => { cycle.stop(); phase.stopAnimation(); phase.setValue(0); };
  }, [allowed, paused, phase, repeat]);
  const lift = kind === 'dragon' ? -5 : kind === 'seal' ? -3 : -4;
  const tilt = kind === 'dragon' ? '.6deg' : kind === 'seal' ? '0deg' : '-.4deg';
  return <View style={style}>
    <Animated.View style={{ transform: [
      { translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [0, lift] }) },
      { rotate: phase.interpolate({ inputRange: [0, 1], outputRange: ['0deg', tilt] }) },
      { scale: phase.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] }) },
    ] }}>{children}</Animated.View>
    {repeat && allowed && <Pressable accessibilityRole="button" accessibilityLabel={paused ? 'เล่นภาพเคลื่อนไหว' : 'หยุดภาพเคลื่อนไหว'} onPress={() => setPaused(!paused)} style={styles.control}>
      <View style={styles.controlDisc}><Text accessible={false} style={styles.controlText}>{paused ? '▶' : 'Ⅱ'}</Text></View>
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  control: { position: 'absolute', bottom: 0, right: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  controlDisc: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#244b3c', borderWidth: 1, borderColor: '#cfb76f', alignItems: 'center', justifyContent: 'center' },
  controlText: { color: '#fff4d6', fontSize: 12, fontWeight: '700', lineHeight: 18 },
});
