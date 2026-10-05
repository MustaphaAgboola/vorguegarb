import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ACCENT = '#208AEF';

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Order confirmed' }} />

      <ThemedText type="subtitle" style={styles.centerText}>
        Order placed
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
        Thanks! We have received your order and will email you a confirmation.
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.idBox}>
        <ThemedText type="small" themeColor="textSecondary">
          Order ID
        </ThemedText>
        <ThemedText type="smallBold" selectable>
          {id}
        </ThemedText>
      </ThemedView>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/orders')}
        style={({ pressed }) => [
          styles.secondaryButton,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.text }}>
          View my orders
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/')}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.primaryLabel}>
          Return to Shop
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  idBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  primaryButton: {
    alignSelf: 'stretch',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    backgroundColor: ACCENT,
  },
  primaryLabel: {
    color: '#ffffff',
  },
  secondaryButton: {
    alignSelf: 'stretch',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
