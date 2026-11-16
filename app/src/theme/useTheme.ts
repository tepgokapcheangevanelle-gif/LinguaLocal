import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from './index';

export function useTheme(): ThemeColors {
  return useColorScheme() === 'dark' ? Colors.dark : Colors.light;
}
