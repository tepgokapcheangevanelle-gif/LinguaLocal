import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

export default function FavoritesScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <AppText variant="title">Favoris</AppText>
        <EmptyState title="Aucun favori. Touchez ♡ sur un résultat pour l'ajouter." />
        <AppText variant="small" tone="secondary">
          Les favoris seront enregistrés sur l'appareil à l'étape 6 du plan.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md },
});
