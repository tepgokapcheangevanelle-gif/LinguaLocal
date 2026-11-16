import { StyleSheet, TextInput, View, Pressable } from 'react-native';

import { AppText } from './AppText';
import { Radius, Spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export function SearchBar({ value, onChangeText, onSubmit, loading = false }: SearchBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Saisir un mot ou une expression en français"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Saisir un mot ou une expression en français"
        returnKeyType="search"
        autoCorrect={false}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chercher"
        disabled={loading}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary, opacity: loading || pressed ? 0.7 : 1 },
        ]}>
        <AppText variant="body" style={styles.buttonLabel}>
          Chercher
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'stretch',
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    minWidth: 96,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
