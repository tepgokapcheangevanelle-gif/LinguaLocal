import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { ResultCard } from '@/components/ResultCard';
import { SearchBar } from '@/components/SearchBar';
import { countEntries, searchEntries } from '@/services/dictionary';
import { initDatabases } from '@/db/client';
import { Radius, Spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import type { EntryResult, SearchResponse } from '@/types';

type UiState =
  | { kind: 'idle' }
  | { kind: 'empty' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'result'; response: SearchResponse };

function Section({ title, entries }: { title: string; entries: EntryResult[] }) {
  if (entries.length === 0) return null;
  return (
    <View style={styles.section}>
      <AppText variant="small" tone="secondary" style={styles.sectionTitle}>
        {title}
      </AppText>
      {entries.map((entry) => (
        <ResultCard key={entry.entryId} entry={entry} />
      ))}
    </View>
  );
}

export default function TranslateScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<UiState>({ kind: 'idle' });
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      await initDatabases();
      setEntryCount(await countEntries());
    } catch {
      setLoadError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const submit = useCallback(async () => {
    if (!query.trim()) {
      setState({ kind: 'empty' });
      return;
    }
    setState({ kind: 'loading' });
    try {
      const response = await searchEntries(query);
      setState({ kind: 'result', response });
    } catch {
      setState({ kind: 'error' });
    }
  }, [query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.header}>
          <AppText variant="title" tone="primary">
            LinguaLocal
          </AppText>
          <AppText tone="secondary">
            Mots et expressions du vocabulaire documenté, français → fulfulde.
          </AppText>
          <AppText variant="small" tone="secondary">
            {loadError
              ? 'Dictionnaire indisponible'
              : entryCount === null
                ? 'Chargement du dictionnaire…'
                : `${entryCount} entrées dans la base de test`}
          </AppText>
        </View>

        {loadError ? (
          <View
            style={[styles.errorBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppText variant="subtitle">Dictionnaire indisponible</AppText>
            <AppText variant="small" tone="secondary">
              La base embarquée n'a pas pu être ouverte.
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => void load()}
              style={({ pressed }) => [
                styles.retry,
                { backgroundColor: theme.primary, opacity: pressed ? 0.7 : 1 },
              ]}>
              <AppText variant="body" style={styles.retryLabel}>
                Réessayer
              </AppText>
            </Pressable>
          </View>
        ) : (
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={() => void submit()}
            loading={state.kind === 'loading'}
          />
        )}

        {state.kind === 'idle' ? (
          <EmptyState
            title="Essayez : poisson, sac, sorgho"
            hint="Ce dictionnaire couvre surtout l'agriculture et la nature (Diamaré). Il ne traduit pas des phrases libres."
          />
        ) : null}

        {state.kind === 'empty' ? (
          <AppText variant="small" tone="error">
            Saisissez un mot à rechercher.
          </AppText>
        ) : null}

        {state.kind === 'loading' ? <AppText tone="secondary">Recherche…</AppText> : null}

        {state.kind === 'error' ? (
          <EmptyState
            title="Dictionnaire indisponible"
            hint="Fermez puis rouvrez l'application, ou touchez Réessayer."
          />
        ) : null}

        {state.kind === 'result' ? (
          state.response.status === 'no_match' ? (
            <EmptyState
              title="Aucune correspondance dans le dictionnaire."
              hint="Ce mot n'est pas encore documenté. Le dictionnaire couvre surtout l'agriculture et la nature (Diamaré)."
            />
          ) : state.response.status === 'ok' ? (
            <>
              <Section title="CORRESPONDANCE EXACTE" entries={state.response.exact} />
              <Section title="RÉSULTATS PROCHES" entries={state.response.related} />
              {state.response.words.length > 0 ? (
                <>
                  <AppText variant="small" tone="secondary">
                    Ces mots sont traduits séparément. Ce n'est pas une traduction de la phrase.
                  </AppText>
                  <Section title="MOTS DE VOTRE SAISIE" entries={state.response.words} />
                </>
              ) : null}
            </>
          ) : null
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: { gap: Spacing.xs },
  section: { gap: Spacing.sm },
  sectionTitle: { letterSpacing: 0.5, fontWeight: '700' },
  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  retry: {
    alignSelf: 'flex-start',
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  retryLabel: { color: '#FFFFFF', fontWeight: '600' },
});
