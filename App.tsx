import 'react-native-reanimated';
import { useState } from 'react';
import {
  LibreBaskerville_400Regular,
  LibreBaskerville_700Bold,
} from '@expo-google-fonts/libre-baskerville';
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandedLoader } from './src/components/BrandedLoader';
import type { ShownYearByWordId } from './src/domain/shownYear';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { useIsDark } from './src/theme/useThemeColors';

export default function App() {
  const [fontsLoaded] = useFonts({
    LibreBaskerville_400Regular,
    LibreBaskerville_700Bold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });
  const isDark = useIsDark();
  const [screen, setScreen] = useState<'home' | 'history'>('home');
  const [historyShown, setHistoryShown] = useState<ShownYearByWordId>({});

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <BrandedLoader />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === 'home' ? (
        <HomeScreen
          onOpenHistory={(shown) => {
            setHistoryShown(shown);
            setScreen('history');
          }}
        />
      ) : (
        <HistoryScreen shownYearByWordId={historyShown} onBack={() => setScreen('home')} />
      )}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}
