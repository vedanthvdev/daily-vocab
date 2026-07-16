import { useColorScheme } from 'react-native';
import { colorsForScheme, type ThemeColors } from './colors';

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return colorsForScheme(scheme);
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}
