import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { formatNaira } from '@/lib/catalog';
import { fetchOrders, formatDate, shortOrderId, type Order } from '@/lib/orders';

const ACCENT = '#208AEF';
const HAIRLINE = '#8884';

function StatusBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: confirmed ? '#DCFCE7' : '#FEF3C7' },
      ]}>
      <ThemedText
        style={[styles.badgeLabel, { color: confirmed ? '#166534' : '#92400E' }]}>
        {confirmed ? 'Confirmed' : 'Pending'}
      </ThemedText>
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const items = order.order_items ?? [];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeading}>
          <ThemedText type="smallBold">Order #{shortOrderId(order.id)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(order.created_at)}
          </ThemedText>
        </View>
        <StatusBadge confirmed={order.status === 'confirmed'} />
      </View>

      <View style={styles.itemsBox}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[styles.itemRow, index > 0 && styles.itemRowDivider]}>
            <ThemedText type="small" style={styles.itemName} numberOfLines={2}>
              {item.name}
              {item.size ? ` · ${item.size}` : ''} × {item.quantity}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.itemPrice}>
              {formatNaira(item.unit_price * item.quantity)}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.address}>
          {order.address}, {order.city}, {order.state}
        </ThemedText>
        <ThemedText type="smallBold">{formatNaira(order.total)}</ThemedText>
      </View>
    </ThemedView>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, loading: sessionLoading } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userId = session?.user.id ?? null;

  const load = useCallback(async () => {
    try {
      const rows = await fetchOrders();
      setOrders(rows);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void load();
  }, [sessionLoading, userId, load]);

  function handleRefresh() {
    setRefreshing(true);
    void load();
  }

  function handleRetry() {
    setLoading(true);
    void load();
  }

  if (sessionLoading || (loading && !error)) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="smallBold">Sign in to see your orders</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Please sign in to view your order history.
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

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <View style={styles.errorBox}>
          <ThemedText type="small" style={styles.errorText}>
            We couldn&apos;t load your orders right now. Please try again.
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={handleRetry}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.primaryLabel}>
            Try again
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (orders.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="smallBold">No orders yet</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          When you place your first order it will show up here.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.primaryLabel}>
            Shop the collection
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={ACCENT} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">My Orders</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Every piece you&apos;ve ordered from VogueGarb.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
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
  },
  centerText: {
    textAlign: 'center',
  },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.half,
    marginBottom: Spacing.one,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardHeading: {
    gap: Spacing.half,
  },
  badge: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
    borderBottomColor: HAIRLINE,
    paddingVertical: Spacing.half,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  itemRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  itemName: {
    flex: 1,
  },
  itemPrice: {
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  address: {
    flex: 1,
  },
  errorBox: {
    alignSelf: 'stretch',
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(229, 72, 77, 0.1)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  errorText: {
    color: '#B42318',
    textAlign: 'center',
  },
  primaryButton: {
    minWidth: 200,
    minHeight: 48,
    marginTop: Spacing.two,
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
  pressed: {
    opacity: 0.7,
  },
});


