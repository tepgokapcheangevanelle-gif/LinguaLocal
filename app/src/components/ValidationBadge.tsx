import { StyleSheet, View } from 'react-native';

import type { ValidationStatus } from '@/types';

import { AppText } from './AppText';
import { useTheme } from '@/theme/useTheme';
import { Radius, Spacing } from '@/theme';

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  const theme = useTheme();
  const verified = status === 'verified';
  const color = verified ? theme.verified : theme.unverified;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <AppText variant="small" style={{ color, fontWeight: '600' }}>
        {verified ? '✓ Vérifié' : 'ⓘ Non vérifié'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
});
