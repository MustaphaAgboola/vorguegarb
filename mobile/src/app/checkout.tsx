import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/catalog';

const ACCENT = '#208AEF';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  multiline?: boolean;
  maxLength?: number;
};

function Field({ label, multiline, ...props }: FieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement },
          multiline && styles.inputMultiline,
        ]}
      />
    </View>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, loading: sessionLoading } = useSession();
  const { items, count, subtotal } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim() || !state.trim()) {
      Alert.alert('Missing details', 'Please fill in your name, phone, address, city and state.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Your cart is empty', 'Add an item before checking out.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          notes: notes.trim(),
          items: items.map((item) => ({
            productId: item.product_id,
            size: item.size || null,
            quantity: item.quantity,
          })),
        }),
      });

      const body = (await response.json().catch(() => null)) as {
        error?: string;
        orderId?: string;
      } | null;

      if (!response.ok) {
        Alert.alert('Could not place order', body?.error ?? `Request failed (${response.status}).`);
        return;
      }
      if (!body?.orderId) {
        Alert.alert('Could not place order', 'No order id was returned.');
        return;
      }

      router.replace({ pathname: '/order/[id]', params: { id: body.orderId } });
    } catch (error) {
      Alert.alert(
        'Could not place order',
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="smallBold">Sign in to check out</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Please sign in to place your order.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/account')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.primaryLabel}>
            Sign in
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="small" themeColor="textSecondary">
            {count} {count === 1 ? 'item' : 'items'} · {formatNaira(subtotal)}
          </ThemedText>

          <Field
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ada Obi"
            autoCapitalize="words"
            maxLength={100}
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="0801 234 5678"
            keyboardType="phone-pad"
            maxLength={20}
          />
          <Field
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="12 Adeola Odeku Street"
            multiline
            maxLength={250}
          />
          <Field
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Lagos"
            autoCapitalize="words"
            maxLength={80}
          />
          <Field
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="Lagos"
            autoCapitalize="words"
            maxLength={80}
          />
          <Field
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Delivery instructions"
            multiline
            maxLength={500}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting }}
            disabled={submitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || submitting) && styles.pressed,
            ]}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.primaryLabel}>
                Place order
              </ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignSelf: 'stretch',
    minHeight: 56,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  primaryLabel: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
