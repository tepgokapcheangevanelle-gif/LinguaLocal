import { StyleSheet, View } from 'react-native';

import type { EntryResult } from '@/types';
import { Radius, Spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { ValidationBadge } from './ValidationBadge';

export function ResultCard({ entry }: { entry: EntryResult }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.heading}>
        <AppText variant="subtitle">{entry.term}</AppText>
        {entry.grammaticalCategory ? (
          <AppText variant="small" tone="secondary">
            {entry.grammaticalCategory}
          </AppText>
        ) : null}
      </View>

      {entry.definition ? (
        <AppText variant="small" tone="secondary">
          {entry.definition}
        </AppText>
      ) : null}

      {entry.translations.map((translation) => (
        <View key={translation.id} style={[styles.translation, { borderTopColor: theme.border }]}>
          <AppText variant="target">{translation.targetTerm}</AppText>
          <ValidationBadge status={translation.validationStatus} />
          <AppText variant="small" tone="secondary">
            {translation.source ?? 'Source non renseignée'}
            {translation.sourceReference ? ` · ${translation.sourceReference}` : ''}
            {translation.dialect ? ` · ${translation.dialect}` : ''}
          </AppText>
          {translation.example ? <AppText variant="small">{translation.example}</AppText> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  translation: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
});
