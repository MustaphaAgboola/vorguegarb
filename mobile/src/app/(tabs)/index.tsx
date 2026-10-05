import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchProducts, formatNaira, resolveImageUrl, type Product } from '@/lib/catalog';

const ACCENT = '#208AEF';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const uri = resolveImageUrl(product.image_url);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatNaira(product.price)}`}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.imageWrapper}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            No image
          </ThemedText>
        )}
      </ThemedView>
      <ThemedText type="smallBold" numberOfLines={2}>
        {product.name}
      </ThemedText>
      <ThemedText type="small" style={styles.price}>
        {formatNaira(product.price)}
      </ThemedText>
      {!product.in_stock && (
        <ThemedText type="small" themeColor="textSecondary">
          Out of stock
        </ThemedText>
      )}
    </Pressable>
  );
}

export default function ShopScreen() {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchProducts());
    } catch (err) {
      setProducts(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="smallBold">Could not load products</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {error}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={load}
          style={({ pressed }) => [
            styles.retry,
            { backgroundColor: ACCENT },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={styles.retryLabel}>
            Try again
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!products || products.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="smallBold">No products yet</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Check back soon for new arrivals.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.heading}>
            Shop
          </ThemedText>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
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
    paddingBottom: BottomTabInset + Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  heading: {
    marginBottom: Spacing.one,
  },
  row: {
    gap: Spacing.three,
  },
  card: {
    flex: 1,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.one,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  price: {
    color: ACCENT,
  },
  retry: {
    marginTop: Spacing.two,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  retryLabel: {
    color: '#ffffff',
  },
});
