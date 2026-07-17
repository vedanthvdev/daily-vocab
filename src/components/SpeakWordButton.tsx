import { Pressable, StyleSheet, Text } from 'react-native';
import { speakWord } from '../audio/speakWord';
import { useThemeColors } from '../theme/useThemeColors';

type Props = {
  word: string;
};

export function SpeakWordButton({ word }: Props) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() => {
        void speakWord(word);
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Pronounce today’s word"
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <Text
        style={[styles.icon, { color: colors.inkMuted }]}
        accessible={false}
        importantForAccessibility="no"
      >
        🔊
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 15,
    lineHeight: 18,
    opacity: 0.85,
  },
});
