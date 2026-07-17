import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playJelly } from '../audio/playJelly';
import { BrandedLoader } from '../components/BrandedLoader';
import { LevelButton } from '../components/LevelButton';
import { catalogs, packsForLevel } from '../domain/catalog';
import { ensureTodaysWord } from '../domain/ensureTodaysWord';
import { formatLocalDate } from '../domain/localDate';
import type { ShownYearByWordId } from '../domain/shownYear';
import type { DailyState, Level } from '../domain/types';
import {
  readDailySnapshot,
  syncShownYears,
  syncWidgetState,
  type DailySnapshot,
} from '../native/widgetBridge';
import {
  loadDailyState,
  loadLevel,
  loadShownYearByWordId,
  saveDailyState,
  saveLevel,
  saveShownYearByWordId,
} from '../storage/appPreferences';
import { fonts } from '../theme/typography';
import { useThemeColors } from '../theme/useThemeColors';

const LEVELS: Level[] = ['beginner', 'intermediate', 'hard'];

const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  hard: 'Hard',
};

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function isLevel(value: unknown): value is Level {
  return value === 'beginner' || value === 'intermediate' || value === 'hard';
}

function snapshotToState(snapshot: DailySnapshot): DailyState | null {
  if (
    !isLevel(snapshot.level) ||
    typeof snapshot.localDate !== 'string' ||
    typeof snapshot.wordId !== 'string' ||
    typeof snapshot.word !== 'string' ||
    typeof snapshot.oneLiner !== 'string'
  ) {
    return null;
  }
  const locked = {
    wordId: snapshot.wordId,
    word: snapshot.word,
    oneLiner: snapshot.oneLiner,
  };
  return {
    level: snapshot.level,
    localDate: snapshot.localDate,
    wordId: snapshot.wordId,
    word: snapshot.word,
    oneLiner: snapshot.oneLiner,
    byLevel: { [snapshot.level]: locked },
  };
}

function mergeDailyStates(
  primary: DailyState | null,
  secondary: DailyState | null,
): DailyState | null {
  if (!primary) return secondary;
  if (!secondary) return primary;
  if (primary.localDate !== secondary.localDate) return primary;
  return {
    ...primary,
    byLevel: { ...secondary.byLevel, ...primary.byLevel },
  };
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

type Props = {
  onOpenHistory: (shown: ShownYearByWordId) => void;
};

export function HomeScreen({ onOpenHistory }: Props) {
  const colors = useThemeColors();
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<Level | null>(null);
  const [today, setToday] = useState<DailyState | null>(null);
  const [shown, setShown] = useState<ShownYearByWordId>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [savedLevel, savedState, nativeSnapshot, savedShown] = await Promise.all([
          loadLevel(),
          loadDailyState(),
          readDailySnapshot(),
          loadShownYearByWordId(),
        ]);
        if (cancelled) return;

        const todayStr = formatLocalDate(new Date());
        const nativeToday =
          nativeSnapshot && nativeSnapshot.localDate === todayStr
            ? snapshotToState(nativeSnapshot)
            : null;
        const savedToday =
          savedState?.localDate === todayStr ? savedState : null;
        const prior =
          mergeDailyStates(savedToday, nativeToday) ?? savedState ?? nativeToday;
        const preference =
          savedLevel ?? nativeToday?.level ?? savedToday?.level ?? null;

        if (!preference && !nativeToday) {
          setShown(savedShown);
          return;
        }

        if (!preference && nativeToday) {
          try {
            const stamped = ensureTodaysWord({
              level: nativeToday.level,
              catalog: catalogs,
              packs: packsForLevel(nativeToday.level),
              shownYearByWordId: savedShown,
              state: nativeToday,
              now: new Date(),
              randomInt,
            });
            setLevel(nativeToday.level);
            setToday(stamped.state);
            setShown(stamped.shownYearByWordId);
            await Promise.all([
              saveLevel(nativeToday.level),
              saveDailyState(stamped.state),
              saveShownYearByWordId(stamped.shownYearByWordId),
              syncShownYears(stamped.shownYearByWordId),
              syncWidgetState({
                state: stamped.state,
                level: nativeToday.level,
                reload: false,
              }),
            ]);
          } catch {
            setShown(savedShown);
          }
          return;
        }

        if (!preference) return;

        try {
          const next = ensureTodaysWord({
            level: preference,
            catalog: catalogs,
            packs: packsForLevel(preference),
            shownYearByWordId: savedShown,
            state: prior,
            now: new Date(),
            randomInt,
          });
          if (cancelled) return;
          setLevel(preference);
          setToday(next.state);
          setShown(next.shownYearByWordId);
          await Promise.all([
            saveDailyState(next.state),
            saveLevel(preference),
            saveShownYearByWordId(next.shownYearByWordId),
            syncShownYears(next.shownYearByWordId),
            syncWidgetState({ state: next.state, level: preference, reload: true }),
          ]);
        } catch {
          setLevel(preference);
          setShown(savedShown);
        }
      } catch {
        setShown({});
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
        const [prior, savedShown] = await Promise.all([
          loadDailyState(),
          loadShownYearByWordId(),
        ]);
        const rolled = ensureTodaysWord({
          level: nextLevel,
          catalog: catalogs,
          packs: packsForLevel(nextLevel),
          shownYearByWordId: savedShown,
          state: prior,
          now: new Date(),
          randomInt,
        });
        const levelChanged = level !== nextLevel;
        setLevel(nextLevel);
        setToday(rolled.state);
        setShown(rolled.shownYearByWordId);
        if (levelChanged) {
          void playJelly();
        }
        await Promise.all([
          saveLevel(nextLevel),
          saveDailyState(rolled.state),
          saveShownYearByWordId(rolled.shownYearByWordId),
          syncShownYears(rolled.shownYearByWordId),
          syncWidgetState({
            state: rolled.state,
            level: nextLevel,
            reload: true,
          }),
        ]);
      } catch {
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
  const lockedLabel = today ? LEVEL_LABEL[today.level] : null;

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
          <View style={styles.topRow}>
            <Text style={[styles.brand, { color: colors.ink }]}>Daily Vocab</Text>
            <Pressable onPress={() => onOpenHistory(shown)} hitSlop={10}>
              <Text style={[styles.historyLink, { color: colors.inkMuted }]}>History</Text>
            </Pressable>
          </View>
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
                  Today · {lockedLabel}
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
            Choose a level
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
          <Text style={[styles.privacy, { color: colors.inkMuted }]}>
            Privacy: words and progress stay on this device. Nothing is uploaded.
          </Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    fontSize: 40,
    fontFamily: fonts.display,
    letterSpacing: -1,
    flexShrink: 1,
  },
  historyLink: {
    fontSize: 15,
    fontFamily: fonts.bodySemi,
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
  privacy: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
});
