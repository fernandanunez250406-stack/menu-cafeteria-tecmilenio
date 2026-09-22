import { useCallback, useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { BackendOrder, getOrders } from "../services/api";

import { useAdmin } from "../context/AdminContext";

import {
    menuColors,
    menuRadius,
    menuSpacing,
    menuTypography,
} from "../constants/menuTheme";

export default function EarningsScreen() {
  const { isAdmin } = useAdmin();

  const [orders, setOrders] = useState<BackendOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders();

      setOrders(data);
    } catch (error) {
      console.error("Error al cargar pedidos para ganancias:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    void loadOrders();

    const interval = setInterval(() => {
      void loadOrders();
    }, 8000);

    return () => clearInterval(interval);
  }, [isAdmin, loadOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.status === "entregado"),
    [orders],
  );

  const totalEarnings = useMemo(
    () =>
      deliveredOrders.reduce(
        (total, order) => total + Number(order.total ?? 0),
        0,
      ),
    [deliveredOrders],
  );

  const averageTicket = useMemo(() => {
    if (deliveredOrders.length === 0) {
      return 0;
    }

    return totalEarnings / deliveredOrders.length;
  }, [deliveredOrders, totalEarnings]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔒</Text>

          <Text style={styles.emptyTitle}>Acceso restringido</Text>

          <Text style={styles.emptyText}>
            Esta sección solo está disponible para administradores.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Ganancias</Text>

        <Text style={styles.subtitle}>Resumen de pedidos entregados</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={menuColors.accent} />
        </View>
      ) : (
        <FlatList
          data={deliveredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.mainCard}>
                <Text style={styles.mainLabel}>Ganancias totales</Text>

                <Text style={styles.mainAmount}>
                  ${totalEarnings.toFixed(2)}
                </Text>

                <Text style={styles.mainDescription}>
                  Solo se contabilizan pedidos entregados.
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Pedidos entregados</Text>

                  <Text style={styles.statValue}>{deliveredOrders.length}</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Ticket promedio</Text>

                  <Text style={styles.statValue}>
                    ${averageTicket.toFixed(2)}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Pedidos entregados</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyOrdersEmoji}>📊</Text>

              <Text style={styles.emptyOrdersTitle}>
                Todavía no hay ganancias
              </Text>

              <Text style={styles.emptyOrdersText}>
                Cuando un pedido pase a "Entregado", su total aparecerá aquí.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle}>
                    Pedido #{item.authCode ?? "—"}
                  </Text>

                  <Text style={styles.customerName}>{item.studentName}</Text>
                </View>

                <Text style={styles.orderAmount}>
                  ${Number(item.total ?? 0).toFixed(2)}
                </Text>
              </View>

              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: menuColors.background,
  },

  header: {
    paddingHorizontal: menuSpacing.lg,
    paddingVertical: menuSpacing.md,
  },

  title: {
    ...menuTypography.title,
    fontSize: 26,
    color: menuColors.textPrimary,
  },

  subtitle: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    marginTop: 4,
  },

  list: {
    padding: menuSpacing.md,
    paddingBottom: 120,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  mainCard: {
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.lg,
    padding: menuSpacing.lg,
    marginBottom: menuSpacing.md,
  },

  mainLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: menuColors.textSecondary,
  },

  mainAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: menuColors.accent,
    marginTop: 6,
  },

  mainDescription: {
    fontSize: 12,
    color: menuColors.textSecondary,
    marginTop: 6,
  },

  statsRow: {
    flexDirection: "row",
    gap: menuSpacing.sm,
    marginBottom: menuSpacing.lg,
  },

  statCard: {
    flex: 1,
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.lg,
    padding: menuSpacing.md,
  },

  statLabel: {
    fontSize: 12,
    color: menuColors.textSecondary,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: menuColors.textPrimary,
    marginTop: 5,
  },

  sectionTitle: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
    marginBottom: menuSpacing.sm,
  },

  orderCard: {
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.lg,
    padding: menuSpacing.md,
    marginBottom: menuSpacing.sm,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderInfo: {
    flex: 1,
    marginRight: menuSpacing.sm,
  },

  orderTitle: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
    fontWeight: "700",
  },

  customerName: {
    color: menuColors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },

  orderAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: menuColors.accent,
  },

  date: {
    marginTop: 6,
    color: menuColors.textSecondary,
    fontSize: 12,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: menuSpacing.xl,
  },

  emptyEmoji: {
    fontSize: 60,
    marginBottom: menuSpacing.md,
  },

  emptyTitle: {
    ...menuTypography.subtitle,
    fontSize: 20,
    color: menuColors.textPrimary,
    textAlign: "center",
  },

  emptyText: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    textAlign: "center",
    marginTop: menuSpacing.sm,
  },

  emptyOrders: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: menuSpacing.xl,
  },

  emptyOrdersEmoji: {
    fontSize: 50,
    marginBottom: menuSpacing.md,
  },

  emptyOrdersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: menuColors.textPrimary,
    textAlign: "center",
  },

  emptyOrdersText: {
    fontSize: 13,
    color: menuColors.textSecondary,
    textAlign: "center",
    marginTop: menuSpacing.sm,
  },
});
