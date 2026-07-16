export type ThemeColors = {
  background: string;
  backgroundAccent: string;
  backgroundDeep: string;
  ink: string;
  inkMuted: string;
  beginner: string;
  intermediate: string;
  hard: string;
  beginnerSoft: string;
  intermediateSoft: string;
  hardSoft: string;
  buttonText: string;
  chipIdle: string;
  chipIdleText: string;
  surface: string;
  surfaceBorder: string;
  tip: string;
  wash: string;
  selectedBorder: string;
  gradient: [string, string, string];
};

export const lightColors: ThemeColors = {
  background: '#F6F1E8',
  backgroundAccent: '#E7EFE4',
  backgroundDeep: '#EDE6DA',
  ink: '#1A2620',
  inkMuted: '#66756C',
  beginner: '#3D8F6A',
  intermediate: '#C56A35',
  hard: '#B04555',
  beginnerSoft: '#D8EDE2',
  intermediateSoft: '#F5E2D2',
  hardSoft: '#F3D9DE',
  buttonText: '#1A2620',
  chipIdle: 'rgba(26, 38, 32, 0.06)',
  chipIdleText: '#4A5A52',
  surface: 'rgba(255, 253, 248, 0.78)',
  surfaceBorder: 'rgba(26, 38, 32, 0.08)',
  tip: '#3F4E46',
  wash: 'rgba(26, 38, 32, 0.12)',
  selectedBorder: '#1A2620',
  gradient: ['#F6F1E8', '#E7EFE4', '#EDE6DA'],
};

export const darkColors: ThemeColors = {
  background: '#0F1412',
  backgroundAccent: '#17201C',
  backgroundDeep: '#0B100E',
  ink: '#EFF4F0',
  inkMuted: '#9AABA1',
  beginner: '#7BC4A0',
  intermediate: '#E0A278',
  hard: '#E0909C',
  beginnerSoft: 'rgba(123, 196, 160, 0.22)',
  intermediateSoft: 'rgba(224, 162, 120, 0.22)',
  hardSoft: 'rgba(224, 144, 156, 0.22)',
  buttonText: '#0F1412',
  chipIdle: 'rgba(239, 244, 240, 0.08)',
  chipIdleText: '#B7C6BC',
  surface: 'rgba(28, 38, 33, 0.72)',
  surfaceBorder: 'rgba(239, 244, 240, 0.1)',
  tip: '#C9D5CE',
  wash: 'rgba(239, 244, 240, 0.14)',
  selectedBorder: '#EFF4F0',
  gradient: ['#0F1412', '#17201C', '#0B100E'],
};

export const colors = lightColors;

export function colorsForScheme(
  scheme: string | null | undefined,
): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}
