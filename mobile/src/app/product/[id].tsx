import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { fetchProduct, formatNaira, resolveImageUrl, type Product } from '@/lib/catalog';

const ACCENT = '#208AEF';
const MAX_QUANTITY = 20;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { session } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProduct(await fetchProduct(id));
    } catch (err) {
      setProduct(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddToCart() {
    if (!product) return;

    if (product.sizes.length > 0 && !size) {
      Alert.alert('Choose a size', 'Pick a size before adding this to your cart.');
      return;
    }

    if (!session) {
      Alert.alert('Please sign in', 'Sign in from the Account tab to add items to your cart.');
      return;
    }

    setAdding(true);
    try {
      const response = await api('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, size: size ?? '', quantity }),
      });

      if (response.status === 401) {
        Alert.alert('Please sign in', 'Your session expired. Sign in again to add items.');
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        Alert.alert('Could not add to cart', body?.error ?? `Request failed (${response.status}).`);
        return;
      }

      Alert.alert('Added to cart', `${product.name}${size ? ` · ${size}` : ''} · Qty ${quantity}`);
    } catch (err) {
      Alert.alert('Could not add to cart', getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Product' }} />
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (error || !product) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Product' }} />
        <ThemedText type="smallBold">
          {error ? 'Could not load this product' : 'Product not found'}
        </ThemedText>
        {error ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            {error}
          </ThemedText>
        ) : null}
        {error ? (
          <Pressable
            accessibilityRole="button"
            onPress={load}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.primaryLabel}>
              Try again
            </ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
    );
  }

  const uri = resolveImageUrl(product.image_url);
  const sizes = product.sizes ?? [];
  const needsSize = sizes.length > 0;
  const canAdd = product.in_stock && (!needsSize || !!size) && !adding;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView type="backgroundElement" style={styles.imageWrapper}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} />
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              No image
            </ThemedText>
          )}
        </ThemedView>

        <View style={styles.headerBlock}>
          <ThemedText type="subtitle">{product.name}</ThemedText>
          <ThemedText type="smallBold" style={styles.price}>
            {formatNaira(product.price)}
          </ThemedText>
        </View>

        {product.description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {product.description}
          </ThemedText>
        ) : null}

        {needsSize ? (
          <View style={styles.section}>
            <ThemedText type="smallBold">Size</ThemedText>
            <View style={styles.chipRow}>
              {sizes.map((option) => {
                const selected = option === size;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSize(option)}
                    style={({ pressed }) => [
                      styles.chip,
                      { borderColor: selected ? ACCENT : theme.backgroundSelected },
                      selected && { backgroundColor: ACCENT },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="small" style={selected ? styles.chipSelectedLabel : undefined}>
                      {option}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="smallBold">Quantity</ThemedText>
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              disabled={quantity <= 1}
              onPress={() => setQuantity((value) => Math.max(1, value - 1))}
              style={({ pressed }) => [
                styles.stepperButton,
                { backgroundColor: theme.backgroundElement },
                (pressed || quantity <= 1) && styles.pressed,
              ]}>
              <ThemedText type="smallBold">−</ThemedText>
            </Pressable>
            <ThemedText type="smallBold" style={styles.quantity}>
              {quantity}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              disabled={quantity >= MAX_QUANTITY}
              onPress={() => setQuantity((value) => Math.min(MAX_QUANTITY, value + 1))}
              style={({ pressed }) => [
                styles.stepperButton,
                { backgroundColor: theme.backgroundElement },
                (pressed || quantity >= MAX_QUANTITY) && styles.pressed,
              ]}>
              <ThemedText type="smallBold">+</ThemedText>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}
          disabled={!canAdd}
          onPress={handleAddToCart}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: product.in_stock ? ACCENT : theme.backgroundSelected },
            (pressed || !canAdd) && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={styles.primaryLabel}>
            {product.in_stock ? (adding ? 'Adding…' : 'Add to cart') : 'Out of stock'}
          </ThemedText>
        </Pressable>

        {needsSize && !size ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Choose a size to continue.
          </ThemedText>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerBlock: {
    gap: Spacing.one,
  },
  price: {
    color: ACCENT,
  },
  section: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipSelectedLabel: {
    color: '#ffffff',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: 24,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    backgroundColor: ACCENT,
  },
  primaryLabel: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.7,
  },
});
