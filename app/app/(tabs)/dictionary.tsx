import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { ValidationBadge } from '@/components/ValidationBadge';
import { initDatabases } from '@/db/client';
import { listEntries } from '@/services/dictionary';
import { Radius, Spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import type { EntryResult } from '@/types';

export default function DictionaryScreen() {
  const theme = useTheme();
  const [entries, setEntries] = useState<EntryResult[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      await initDatabases();
      setEntries(await listEntries({ offset: 0, limit: 100 }));
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="title">Dictionnaire</AppText>
        <AppText variant="small" tone="secondary">
          {entries === null ? 'Chargement…' : `${entries.length} entrées affichées`}
        </AppText>
      </View>

      {error ? (
        <View style={styles.padded}>
          <EmptyState
            title="Dictionnaire indisponible"
            hint="Fermez puis rouvrez l'application pour réessayer."
          />
        </View>
      ) : entries === null ? null : entries.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState title="Le dictionnaire est vide." />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.entryId)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
          )}
          renderItem={({ item }) => {
            const first = item.translations[0];
            return (
              <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.rowHeading}>
                  <AppText variant="body" style={styles.term}>
                    {item.term}
                  </AppText>
                  {item.grammaticalCategory ? (
                    <AppText variant="small" tone="secondary">
                      {item.grammaticalCategory}
                    </AppText>
                  ) : null}
                </View>
                {first ? (
                  <>
                    <AppText variant="subtitle">{first.targetTerm}</AppText>
                    <ValidationBadge status={first.validationStatus} />
                  </>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  padded: { padding: Spacing.md },
  list: { padding: Spacing.md, gap: Spacing.sm },
  separator: { height: 0 },
  row: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  rowHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  term: { flexShrink: 1 },
});
