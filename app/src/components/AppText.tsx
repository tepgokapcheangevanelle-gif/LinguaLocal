import { StyleSheet, Text, type TextProps } from 'react-native';

import { Typography } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type Variant = 'title' | 'subtitle' | 'body' | 'small' | 'target';
type Tone = 'default' | 'secondary' | 'primary' | 'error';

export type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  const color =
    tone === 'secondary'
      ? theme.textSecondary
      : tone === 'primary'
        ? theme.primary
        : tone === 'error'
          ? theme.error
          : theme.text;

  return <Text style={[{ color }, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: { fontSize: Typography.title, fontWeight: '700' },
  subtitle: { fontSize: Typography.subtitle, fontWeight: '600' },
  body: { fontSize: Typography.body, lineHeight: 24 },
  small: { fontSize: Typography.small, lineHeight: 20 },
  target: { fontSize: Typography.target, fontWeight: '700', lineHeight: 28 },
});
