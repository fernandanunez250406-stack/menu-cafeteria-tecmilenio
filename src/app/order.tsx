import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
} from "../constants/menuTheme";

import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";

import {
  BackendOrder,
  getOrders,
  OrderStatus,
  updateOrderStatus,
} from "../services/api";

const REFRESH_INTERVAL = 8000;

const STATUS_OPTIONS: {
  value: OrderStatus;
  label: string;
}[] = [
  {
    value: "pendiente",
    label: "Pendiente",
  },
  {
    value: "preparando",
    label: "Preparando",
  },
  {
    value: "listo",
    label: "Listo",
  },
  {
    value: "entregado",
    label: "Entregado",
  },
  {
    value: "cancelado",
    label: "Cancelado",
  },
];

const statusLabel = (status: string) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

export default function OrdersScreen() {
  const { isAdmin } = useAdmin();

  return isAdmin ? <AdminOrdersView /> : <CustomerOrdersView />;
}

/* =========================================================
   VISTA DEL CLIENTE
========================================================= */

function CustomerOrdersView() {
  const { orders, refreshOrders } = useCart();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refreshOrders();

    const interval = setInterval(() => {
      void refreshOrders();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);

    try {
      await refreshOrders();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis pedidos</Text>

        <Text style={styles.subtitle}>Consulta tus pedidos realizados</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📦</Text>

          <Text style={styles.emptyTitle}>Todavía no tienes pedidos</Text>

          <Text style={styles.emptyText}>
            Cuando realices un pedido, aparecerá aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleManualRefresh}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderCustomerInfo}>
                  <Text style={styles.orderTitle}>
                    Pedido #{item.authCode ?? "—"}
                  </Text>

                  <Text style={styles.customerName}>{item.studentName}</Text>
                </View>

                <StatusPill status={item.status} />
              </View>

              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>

              <View style={styles.productsContainer}>
                {item.items.map((cartItem: any) => (
                  <View key={cartItem.id} style={styles.productRow}>
                    <Text style={styles.productName}>
                      {cartItem.quantity}x{" "}
                      {cartItem.product?.name ?? "Producto"}
                    </Text>

                    <Text style={styles.productPrice}>
                      $
                      {(
                        Number(cartItem.unitPrice ?? 0) *
                        Number(cartItem.quantity ?? 0)
                      ).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>

                <Text style={styles.total}>
                  ${Number(item.total).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/* =========================================================
   VISTA DEL ADMINISTRADOR
========================================================= */

function AdminOrdersView() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders();

      setOrders(data);
    } catch (error) {
      console.error("Error al cargar las órdenes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();

    const interval = setInterval(() => {
      void loadOrders();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleManualRefresh = async () => {
    setRefreshing(true);

    try {
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const handleChangeStatus = async (
    order: BackendOrder,
    status: OrderStatus,
  ) => {
    if (status === order.status) {
      return;
    }

    setUpdatingId(order.id);

    try {
      const updated = await updateOrderStatus(order.id, status);

      setOrders((current) =>
        current.map((item) => (item.id === order.id ? updated : item)),
      );
    } catch (error) {
      console.error("Error al cambiar el estado del pedido:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos de clientes</Text>

        <Text style={styles.subtitle}>
          Cambia el estado y el cliente lo verá reflejado
        </Text>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={menuColors.accent} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📦</Text>

          <Text style={styles.emptyTitle}>Aún no hay pedidos</Text>

          <Text style={styles.emptyText}>
            Cuando un cliente realice un pedido, aparecerá aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleManualRefresh}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderCustomerInfo}>
                  <Text style={styles.orderTitle}>
                    Pedido #{item.authCode ?? "—"}
                  </Text>

                  <Text style={styles.customerName}>{item.studentName}</Text>
                </View>

                <StatusPill status={item.status} />
              </View>

              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>

              <View style={styles.productsContainer}>
                {item.items.map((cartItem: any) => (
                  <View key={cartItem.id} style={styles.productRow}>
                    <Text style={styles.productName}>
                      {cartItem.quantity}x{" "}
                      {cartItem.product?.name ?? "Producto"}
                    </Text>

                    <Text style={styles.productPrice}>
                      $
                      {(
                        Number(cartItem.unitPrice ?? 0) *
                        Number(cartItem.quantity ?? 0)
                      ).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>

                <Text style={styles.total}>
                  ${Number(item.total).toFixed(2)}
                </Text>
              </View>

              {/* SELECTOR DE ESTADO */}

              <View style={styles.statusOptionsRow}>
                {STATUS_OPTIONS.map((option) => {
                  const isActive = option.value === item.status;

                  const isUpdating = updatingId === item.id;

                  return (
                    <Pressable
                      key={option.value}
                      disabled={isUpdating}
                      onPress={() =>
                        void handleChangeStatus(item, option.value)
                      }
                      style={({ pressed }) => [
                        styles.statusOption,
                        isActive && styles.statusOptionActive,
                        (pressed || isUpdating) && {
                          opacity: 0.7,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          isActive && styles.statusOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusPillText}>{statusLabel(status)}</Text>
    </View>
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

  orderCard: {
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.lg,
    padding: menuSpacing.md,
    marginBottom: menuSpacing.md,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderCustomerInfo: {
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

  statusPill: {
    backgroundColor: menuColors.accentSoft,
    borderRadius: menuRadius.pill,
    paddingHorizontal: menuSpacing.sm,
    paddingVertical: 4,
  },

  statusPillText: {
    color: menuColors.accent,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
  },

  date: {
    marginTop: 6,
    color: menuColors.textSecondary,
    fontSize: 12,
  },

  productsContainer: {
    marginTop: menuSpacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: menuColors.border,
    paddingVertical: menuSpacing.sm,
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  productName: {
    flex: 1,
    color: menuColors.textPrimary,
    fontSize: 14,
  },

  productPrice: {
    color: menuColors.textSecondary,
    fontSize: 14,
    marginLeft: menuSpacing.sm,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: menuSpacing.md,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: menuColors.textPrimary,
  },

  total: {
    fontSize: 20,
    fontWeight: "700",
    color: menuColors.accent,
  },

  statusOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: menuSpacing.md,
  },

  statusOption: {
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.pill,
    paddingHorizontal: menuSpacing.sm,
    paddingVertical: 6,
  },

  statusOptionActive: {
    backgroundColor: menuColors.accent,
    borderColor: menuColors.accent,
  },

  statusOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: menuColors.textPrimary,
  },

  statusOptionTextActive: {
    color: "#FFFFFF",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: menuSpacing.xl,
  },

  emptyEmoji: {
    fontSize: 70,
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
});
