import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playJelly } from '../audio/playJelly';
import { BrandedLoader } from '../components/BrandedLoader';
import { LevelButton } from '../components/LevelButton';
import { catalogs } from '../domain/catalog';
import { ensureTodaysWord } from '../domain/ensureTodaysWord';
import type { DailyState, Level } from '../domain/types';
import { pushActiveLevel, pushDailySnapshot } from '../native/widgetBridge';
import {
  loadDailyState,
  loadLevel,
  saveDailyState,
  saveLevel,
} from '../storage/appPreferences';
import { fonts } from '../theme/typography';
import { useThemeColors } from '../theme/useThemeColors';

const LEVELS: Level[] = ['beginner', 'intermediate', 'hard'];

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function levelAccent(
  level: Level | string | null | undefined,
  colors: ReturnType<typeof useThemeColors>,
): string {
  switch (level) {
    case 'beginner':
      return colors.beginner;
    case 'intermediate':
      return colors.intermediate;
    case 'hard':
      return colors.hard;
    default:
      return colors.inkMuted;
  }
}

export function HomeScreen() {
  const colors = useThemeColors();
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<Level | null>(null);
  const [today, setToday] = useState<DailyState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const savedLevel = await loadLevel();
        const savedState = await loadDailyState();
        if (cancelled) return;
        if (savedLevel) {
          const next = ensureTodaysWord({
            level: savedLevel,
            catalog: catalogs,
            state: savedState,
            now: new Date(),
            randomInt,
          });
          if (cancelled) return;
          setLevel(savedLevel);
          setToday(next);
          await Promise.all([
            saveDailyState(next),
            pushActiveLevel(savedLevel),
            pushDailySnapshot(next),
          ]);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback(
    async (nextLevel: Level) => {
      if (busy) return;
      setBusy(true);
      try {
        const prior = await loadDailyState();
        const rolled = ensureTodaysWord({
          level: nextLevel,
          catalog: catalogs,
          state: prior,
          now: new Date(),
          randomInt,
        });
        const levelChanged = level !== nextLevel;
        const wordChanged =
          prior?.wordId !== rolled.wordId || prior?.localDate !== rolled.localDate;
        setLevel(nextLevel);
        setToday(rolled);
        if (levelChanged) {
          void playJelly();
        }
        await Promise.all([
          saveLevel(nextLevel),
          saveDailyState(rolled),
          pushActiveLevel(nextLevel),
          wordChanged ? pushDailySnapshot(rolled) : Promise.resolve(),
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, level],
  );

  if (!ready) {
    return <BrandedLoader />;
  }

  const tip =
    Platform.OS === 'ios'
      ? 'Tip: add the Daily Vocab widget to your Lock Screen.'
      : 'Tip: add the Daily Vocab widget to your home screen (lock screen where supported).';

  const accent = levelAccent(today?.level ?? level, colors);

  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.brand, { color: colors.ink }]}>Daily Vocab</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
            One word a day. Pick your pace.
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
            {today ? (
              <>
                <Text style={[styles.todayLabel, { color: colors.inkMuted }]}>
                  Today
                </Text>
                <Text style={[styles.word, { color: colors.ink }]}>{today.word}</Text>
                <Text style={[styles.oneLiner, { color: colors.tip }]}>
                  {today.oneLiner}
                </Text>
              </>
            ) : (
              <Text style={[styles.empty, { color: colors.inkMuted }]}>
                Choose a level to reveal today’s word.
              </Text>
            )}
          </View>

          <Text style={[styles.chooserLabel, { color: colors.inkMuted }]}>
            Level
          </Text>
          <View style={styles.buttons}>
            {LEVELS.map((item, index) => (
              <LevelButton
                key={item}
                level={item}
                index={index}
                selected={level === item}
                onPress={onSelect}
              />
            ))}
          </View>

          <Text style={[styles.tip, { color: colors.inkMuted }]}>{tip}</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 36,
  },
  brand: {
    fontSize: 40,
    fontFamily: fonts.display,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 28,
    paddingRight: 22,
    paddingTop: 22,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  todayLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  word: {
    marginTop: 12,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fonts.display,
  },
  oneLiner: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 25,
    fontFamily: fonts.body,
  },
  empty: {
    fontSize: 17,
    lineHeight: 25,
    fontFamily: fonts.body,
  },
  chooserLabel: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 12,
    fontFamily: fonts.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  tip: {
    marginTop: 28,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.body,
  },
});
