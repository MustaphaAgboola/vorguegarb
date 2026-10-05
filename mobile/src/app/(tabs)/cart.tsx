import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { MAX_QUANTITY, useCart, type CartItem } from '@/context/CartContext';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { formatNaira, resolveImageUrl } from '@/lib/catalog';

const ACCENT = '#208AEF';

function CartRow({ item }: { item: CartItem }) {
  const theme = useTheme();
  const { setQty, remove } = useCart();

  const uri = resolveImageUrl(item.products?.image_url ?? null);
  const price = item.products?.price ?? 0;
  const name = item.products?.name ?? 'Product';
  const atMin = item.quantity <= 1;
  const atMax = item.quantity >= MAX_QUANTITY;

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={styles.thumb}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" transition={200} />
        ) : null}
      </View>

      <View style={styles.rowBody}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {name}
        </ThemedText>
        {item.size ? (
          <ThemedText type="small" themeColor="textSecondary">
            Size: {item.size}
          </ThemedText>
        ) : null}
        <ThemedText type="smallBold" style={styles.price}>
          {formatNaira(price * item.quantity)}
        </ThemedText>

        <View style={styles.controls}>
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decrease quantity of ${name}`}
              disabled={atMin}
              onPress={() => setQty(item.product_id, item.size, item.quantity - 1)}
              style={({ pressed }) => [
                styles.stepButton,
                { backgroundColor: theme.backgroundSelected },
                (pressed || atMin) && styles.pressed,
              ]}>
              <ThemedText type="smallBold">−</ThemedText>
            </Pressable>
            <ThemedText type="smallBold" style={styles.quantity}>
              {item.quantity}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Increase quantity of ${name}`}
              disabled={atMax}
              onPress={() => setQty(item.product_id, item.size, item.quantity + 1)}
              style={({ pressed }) => [
                styles.stepButton,
                { backgroundColor: theme.backgroundSelected },
                (pressed || atMax) && styles.pressed,
              ]}>
              <ThemedText type="smallBold">+</ThemedText>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${name} from cart`}
            onPress={() => remove(item.product_id, item.size)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedText type="small" style={styles.removeLabel}>
              Remove
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, loading: sessionLoading } = useSession();
  const { items, loading, count, subtotal } = useCart();

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
        <ThemedText type="smallBold">Sign in to see your cart</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Please sign in to view your cart and check out.
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

  if (loading && items.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (items.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="smallBold">Your cart is empty</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Add something you love from the Shop tab.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.heading}>
            Cart
          </ThemedText>
        }
        renderItem={({ item }) => <CartRow item={item} />}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <ThemedText type="smallBold">
                Subtotal ({count} {count === 1 ? 'item' : 'items'})
              </ThemedText>
              <ThemedText type="smallBold" style={styles.price}>
                {formatNaira(subtotal)}
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/checkout')}
              style={({ pressed }) => [styles.checkoutButton, pressed && styles.pressed]}>
              <ThemedText style={styles.checkoutLabel}>Checkout</ThemedText>
            </Pressable>
          </View>
        }
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
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  thumb: {
    width: 72,
    height: 96,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  price: {
    color: ACCENT,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: 20,
    textAlign: 'center',
  },
  removeLabel: {
    color: '#E5484D',
  },
  footer: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#8884',
  },
  primaryButton: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  primaryLabel: {
    color: '#ffffff',
  },
  checkoutButton: {
    alignSelf: 'stretch',
    minHeight: 56,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  checkoutLabel: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
