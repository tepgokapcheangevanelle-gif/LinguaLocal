import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

export default function HistoryScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <AppText variant="title">Historique</AppText>
        <EmptyState title="Aucune recherche récente." />
        <AppText variant="small" tone="secondary">
          L'historique local sera branché à l'étape 6 du plan.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md },
});
