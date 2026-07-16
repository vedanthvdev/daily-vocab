import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Level } from '../domain/types';
import { fonts } from '../theme/typography';
import { useThemeColors } from '../theme/useThemeColors';

const LABELS: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  hard: 'Hard',
};

const SELECTED_SCALE = 1.05;
const IDLE_SCALE = 1;

type Props = {
  level: Level;
  selected: boolean;
  index: number;
  onPress: (level: Level) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const jellySpring = { damping: 8, stiffness: 200, mass: 0.65 };

export function LevelButton({ level, selected, index, onPress }: Props) {
  const colors = useThemeColors();
  const enter = useSharedValue(0);
  const press = useSharedValue(1);
  const selectedScale = useSharedValue(selected ? SELECTED_SCALE : IDLE_SCALE);

  const accent =
    level === 'beginner'
      ? colors.beginner
      : level === 'intermediate'
        ? colors.intermediate
        : colors.hard;
  const soft =
    level === 'beginner'
      ? colors.beginnerSoft
      : level === 'intermediate'
        ? colors.intermediateSoft
        : colors.hardSoft;

  useEffect(() => {
    enter.value = withDelay(index * 70, withTiming(1, { duration: 380 }));
  }, [enter, index]);

  useEffect(() => {
    selectedScale.value = withSpring(
      selected ? SELECTED_SCALE : IDLE_SCALE,
      jellySpring,
    );
  }, [selected, selectedScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: (1 - enter.value) * 12 },
      { scale: selectedScale.value * press.value },
    ],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPressIn={() => {
        press.value = withSpring(0.96, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, jellySpring);
      }}
      onPress={() => onPress(level)}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? soft : colors.chipIdle,
          borderColor: selected ? accent : colors.surfaceBorder,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text
        style={[
          styles.label,
          {
            color: selected ? colors.ink : colors.chipIdleText,
            fontFamily: selected ? fonts.bodyBold : fonts.bodySemi,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {LABELS[level]}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
