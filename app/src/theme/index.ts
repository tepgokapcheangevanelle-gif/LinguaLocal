/**
 * Identité visuelle de LinguaLocal (docs/ui-ux.md §2).
 * Toutes les couleurs passent par ce module : ne pas coder de couleur en dur
 * dans les écrans.
 */
export const Colors = {
  light: {
    primary: '#B4571F',
    background: '#FBF6EE',
    surface: '#FFFFFF',
    surfaceMuted: '#F2E9DB',
    text: '#2B2118',
    textSecondary: '#6B5D50',
    verified: '#2E7D32',
    unverified: '#B26A00',
    error: '#B3261E',
    border: '#E4D8C6',
  },
  dark: {
    primary: '#E08B4F',
    background: '#1C1815',
    surface: '#262019',
    surfaceMuted: '#332B22',
    text: '#F4EDE4',
    textSecondary: '#B8A794',
    verified: '#81C784',
    unverified: '#FFB74D',
    error: '#EF9A9A',
    border: '#3A3128',
  },
} as const;

export type ThemeColors = { [Key in keyof typeof Colors.light]: string };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  card: 12,
  pill: 999,
} as const;

export const Typography = {
  title: 24,
  subtitle: 20,
  body: 16,
  small: 14,
  target: 22,
} as const;
