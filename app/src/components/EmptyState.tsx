import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.box, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <AppText variant="body" style={styles.center}>
        {title}
      </AppText>
      {hint ? (
        <AppText variant="small" tone="secondary" style={styles.center}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
});
