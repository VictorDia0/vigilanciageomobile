import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const PIN_D =
  "M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.34 7.39 11.94a1 1 0 0 0 1.22 0C13.28 21.34 20 15.25 20 10c0-4.42-3.58-8-8-8z";

interface Props {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: Props) {
  const ring1Scale = useSharedValue(2.6);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(2.6);
  const ring2Opacity = useSharedValue(0);
  const dotScale = useSharedValue(0);
  const dotOpacity = useSharedValue(0);
  const pinScale = useSharedValue(0.4);
  const pinOpacity = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordTranslateY = useSharedValue(8);

  useEffect(() => {
    ring1Opacity.value = withDelay(0, withTiming(0.55, { duration: 350 }));
    ring1Scale.value = withDelay(0, withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }));

    ring2Opacity.value = withDelay(150, withTiming(0.8, { duration: 350 }));
    ring2Scale.value = withDelay(150, withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }));

    dotOpacity.value = withDelay(500, withTiming(1, { duration: 200 }));
    dotScale.value = withDelay(500, withSpring(1, { damping: 10, stiffness: 200 }));

    pinOpacity.value = withDelay(650, withTiming(1, { duration: 250 }));
    pinScale.value = withDelay(650, withSpring(1, { damping: 9, stiffness: 140 }));

    wordOpacity.value = withDelay(1000, withTiming(1, { duration: 300 }));
    wordTranslateY.value = withDelay(1000, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));

    const timer = setTimeout(() => {
      runOnJS(onFinish)();
    }, 1900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ring1Props = useAnimatedProps(() => ({
    r: 3.3 * ring1Scale.value,
    opacity: ring1Opacity.value,
  }));
  const ring2Props = useAnimatedProps(() => ({
    r: 2.05 * ring2Scale.value,
    opacity: ring2Opacity.value,
  }));
  const dotProps = useAnimatedProps(() => ({
    r: 0.85 * dotScale.value,
    opacity: dotOpacity.value,
  }));
  const pinProps = useAnimatedProps(() => ({
    opacity: pinOpacity.value,
  }));
  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinScale.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordTranslateY.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={pinStyle}>
        <Svg width={140} height={140} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id="pinGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#00D4FF" />
              <Stop offset="1" stopColor="#0057D8" />
            </LinearGradient>
          </Defs>
          <AnimatedPath fill="url(#pinGrad)" d={PIN_D} animatedProps={pinProps} />
          <AnimatedCircle cx={12} cy={9.6} stroke="#FFFFFF" strokeWidth={0.55} fill="none" animatedProps={ring1Props} />
          <AnimatedCircle cx={12} cy={9.6} stroke="#FFFFFF" strokeWidth={0.6} fill="none" animatedProps={ring2Props} />
          <AnimatedCircle cx={12} cy={9.6} fill="#FFFFFF" animatedProps={dotProps} />
        </Svg>
      </Animated.View>

      <Animated.Text style={[styles.wordmark, wordStyle]}>
        SI<Text style={styles.wordmarkAccent}>SVA</Text>
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#090909",
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    marginTop: 24,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 4,
  },
  wordmarkAccent: {
    color: "#00D4FF",
  },
});
