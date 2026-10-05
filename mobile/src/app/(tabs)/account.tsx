import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { signInWithGoogle } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ACCENT = '#208AEF';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary';
};

function ActionButton({ label, onPress, disabled, tone = 'primary' }: ActionButtonProps) {
  const theme = useTheme();
  const isPrimary = tone === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isPrimary ? ACCENT : theme.backgroundElement },
        (pressed || disabled) && styles.buttonPressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: isPrimary ? '#ffffff' : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, loading } = useSession();
  const [busy, setBusy] = useState(false);

  const email = session?.user.email ?? null;

  async function handleSignIn() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Sign-in failed', getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert('Sign-out failed', error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <ThemedText type="subtitle" style={styles.title}>
            Account
          </ThemedText>

          {loading ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <ThemedText themeColor="textSecondary" style={styles.status}>
              {email ? `Signed in as ${email}` : 'Not signed in'}
            </ThemedText>
          )}
        </ThemedView>

        <View style={styles.actions}>
          {email ? (
            <>
              <ActionButton label="My Orders" onPress={() => router.push('/orders')} />
              <ActionButton
                label="Sign out"
                onPress={handleSignOut}
                disabled={busy}
                tone="secondary"
              />
            </>
          ) : (
            <ActionButton label="Continue with Google" onPress={handleSignIn} disabled={busy} />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  status: {
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  button: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
