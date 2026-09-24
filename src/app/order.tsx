import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { menuColors, menuRadius, menuSpacing } from "../constants/menuTheme";

import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";

import {
  BackendOrder,
  getOrders,
  OrderStatus,
  removeOrderItem,
  updateOrderStatus,
} from "../services/api";

const REFRESH_INTERVAL = 8000;

const STATUS_OPTIONS: OrderStatus[] = [
  "pendiente",
  "preparando",
  "listo",
  "entregado",
  "cancelado",
];

const statusLabel: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const statusColor = (status: OrderStatus) => {
  switch (status) {
    case "pendiente":
      return "#D99A24";

    case "preparando":
      return "#D97706";

    case "listo":
      return "#2F6F5E";

    case "entregado":
      return "#4B5563";

    case "cancelado":
      return "#C94C4C";

    default:
      return menuColors.textPrimary;
  }
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Fecha no disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const showMessage = (title: string, message: string) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
    }

    return;
  }

  Alert.alert(title, message);
};

const askConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`${title}\n\n${message}`);

      if (confirmed) {
        void onConfirm();
      }
    }

    return;
  }

  Alert.alert(title, message, [
    {
      text: "No",
      style: "cancel",
    },
    {
      text: "Sí, cancelar",
      style: "destructive",
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
};

export default function OrdersScreen() {
  const { isAdmin } = useAdmin();

  if (isAdmin) {
    return <AdminOrdersView />;
  }

  return <CustomerOrdersView />;
}

/* =========================================================
   CLIENTE
========================================================= */

function CustomerOrdersView() {
  const { orders, refreshOrders, cancelOrder } = useCart();

  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setRefreshing(true);
      }

      try {
        await refreshOrders();
      } finally {
        if (showLoading) {
          setRefreshing(false);
        }
      }
    },
    [refreshOrders],
  );

  useEffect(() => {
    void loadOrders();

    const interval = setInterval(() => {
      void loadOrders();
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [loadOrders]);

  const handleCancelOrder = (order: (typeof orders)[number]) => {
    if (order.status !== "pendiente" && order.status !== "preparando") {
      return;
    }

    askConfirmation(
      "Cancelar pedido",
      `¿Seguro que quieres cancelar el pedido #${order.authCode ?? "—"}?`,
      async () => {
        try {
          await cancelOrder(order.id);

          showMessage(
            "Pedido cancelado",
            "Tu pedido fue cancelado correctamente.",
          );

          await refreshOrders();
        } catch (error) {
          showMessage(
            "No se pudo cancelar",
            error instanceof Error
              ? error.message
              : "No se pudo cancelar el pedido.",
          );
        }
      },
    );
  };

  if (refreshing && orders.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={menuColors.accent} />

          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis pedidos</Text>

          <Text style={styles.subtitle}>
            Tus pedidos se actualizan automáticamente.
          </Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tienes pedidos</Text>

            <Text style={styles.emptyText}>
              Cuando realices un pedido aparecerá aquí su seguimiento.
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={() => void loadOrders(true)}
            renderItem={({ item }) => (
              <CustomerOrderCard
                order={item}
                onCancel={() => handleCancelOrder(item)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function CustomerOrderCard({
  order,
  onCancel,
}: {
  order: ReturnType<typeof useCart>["orders"][number];
  onCancel: () => void;
}) {
  const canCancel = order.status === "pendiente";
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderText}>
          <Text style={styles.orderNumber}>
            Pedido #{order.authCode ?? "—"}
          </Text>

          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              borderColor: statusColor(order.status),
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusColor(order.status),
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: statusColor(order.status),
              },
            ]}
          >
            {statusLabel[order.status]}
          </Text>
        </View>
      </View>

      {order.status === "cancelado" ? (
        <CancelledOrderStatus reason={order.cancellationReason} />
      ) : (
        <CustomerStatusTracker status={order.status} />
      )}

      {order.notice ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Aviso</Text>

          <Text style={styles.noticeText}>{order.notice}</Text>
        </View>
      ) : null}

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Productos</Text>

        {order.items.map((item: any, index: number) => (
          <View key={`${item?.id ?? "item"}-${index}`} style={styles.orderItem}>
            <View style={styles.orderItemMain}>
              <Text style={styles.orderItemName}>
                {item?.product?.name ?? item?.name ?? "Producto"}
              </Text>

              <Text style={styles.orderItemQuantity}>
                x{item?.quantity ?? 1}
              </Text>
            </View>

            <Text style={styles.orderItemPrice}>
              $
              {(
                Number(item?.unitPrice ?? 0) * Number(item?.quantity ?? 1)
              ).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>

        <Text style={styles.totalValue}>${Number(order.total).toFixed(2)}</Text>
      </View>

      {canCancel ? (
        <Pressable
          style={({ pressed }) => [
            styles.cancelOrderButton,
            pressed && styles.cancelOrderButtonPressed,
          ]}
          onPress={onCancel}
        >
          <Text style={styles.cancelOrderButtonText}>Cancelar pedido</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* =========================================================
   TRACKER DEL CLIENTE
========================================================= */

const trackerStatuses: OrderStatus[] = [
  "pendiente",
  "preparando",
  "listo",
  "entregado",
];

function CustomerStatusTracker({ status }: { status: OrderStatus }) {
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const currentIndex = Math.max(trackerStatuses.indexOf(status), 0);

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: currentIndex,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentIndex, progressAnimation]);

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 3],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.trackerContainer}>
      <View style={styles.trackerLineBackground} />

      <Animated.View
        style={[
          styles.trackerLineProgress,
          {
            width: progressWidth,
          },
        ]}
      />

      <View style={styles.trackerSteps}>
        {trackerStatuses.map((trackerStatus, index) => {
          const completed = index <= currentIndex;

          return (
            <View key={trackerStatus} style={styles.trackerStep}>
              <View
                style={[
                  styles.trackerCircle,
                  completed && styles.trackerCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.trackerCircleText,
                    completed && styles.trackerCircleTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              <Text
                style={[
                  styles.trackerLabel,
                  completed && styles.trackerLabelActive,
                ]}
              >
                {statusLabel[trackerStatus]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CancelledOrderStatus({ reason }: { reason?: string }) {
  return (
    <View style={styles.cancelledBox}>
      <Text style={styles.cancelledTitle}>Pedido cancelado</Text>

      <Text style={styles.cancelledText}>
        {reason ?? "Este pedido fue cancelado."}
      </Text>
    </View>
  );
}

/* =========================================================
   ADMINISTRADOR
========================================================= */

function AdminOrdersView() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setRefreshing(true);
    }

    try {
      const result = await getOrders();
      setOrders(result);
    } catch (error) {
      console.error("Error obteniendo órdenes:", error);

      if (showLoading) {
        showMessage(
          "Error",
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los pedidos.",
        );
      }
    } finally {
      setLoading(false);

      if (showLoading) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOrders();

    const interval = setInterval(() => {
      void loadOrders();
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [loadOrders]);

  const handleChangeStatus = (order: BackendOrder, status: OrderStatus) => {
    if (order.status === status) {
      return;
    }

    askConfirmation(
      "Cambiar estado",
      `¿Quieres cambiar el pedido #${
        order.authCode ?? "—"
      } a "${statusLabel[status]}"?`,
      async () => {
        await performStatusUpdate(order.id, status);
      },
    );
  };

  const performStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, status);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updated.id ? updated : order,
        ),
      );
    } catch (error) {
      showMessage(
        "No se pudo actualizar",
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del pedido.",
      );
    }
  };

  const handleRemoveItem = (order: BackendOrder, itemId: string) => {
    askConfirmation(
      "Eliminar producto",
      "¿Quieres quitar este producto del pedido?",
      async () => {
        await performRemoveItem(order.id, itemId);
      },
    );
  };

  const performRemoveItem = async (orderId: string, itemId: string) => {
    try {
      const updated = await removeOrderItem(orderId, itemId);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updated.id ? updated : order,
        ),
      );
    } catch (error) {
      showMessage(
        "No se pudo eliminar",
        error instanceof Error
          ? error.message
          : "No se pudo quitar el producto.",
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={menuColors.accent} />

          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Pedidos</Text>

          <Text style={styles.subtitle}>Administración de pedidos</Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay pedidos</Text>

            <Text style={styles.emptyText}>
              Los pedidos nuevos aparecerán aquí automáticamente.
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={() => void loadOrders(true)}
            renderItem={({ item }) => (
              <AdminOrderCard
                order={item}
                onChangeStatus={handleChangeStatus}
                onRemoveItem={handleRemoveItem}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function AdminOrderCard({
  order,
  onChangeStatus,
  onRemoveItem,
}: {
  order: BackendOrder;
  onChangeStatus: (order: BackendOrder, status: OrderStatus) => void;
  onRemoveItem: (order: BackendOrder, itemId: string) => void;
}) {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderText}>
          <Text style={styles.orderNumber}>
            Pedido #{order.authCode ?? "—"}
          </Text>

          <Text style={styles.customerName}>{order.studentName}</Text>

          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              borderColor: statusColor(order.status),
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusColor(order.status),
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: statusColor(order.status),
              },
            ]}
          >
            {statusLabel[order.status]}
          </Text>
        </View>
      </View>

      {order.cancellationReason ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Motivo de cancelación</Text>

          <Text style={styles.noticeText}>{order.cancellationReason}</Text>
        </View>
      ) : null}

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Productos</Text>

        {order.items.map((item: any, index: number) => (
          <View key={`${item?.id ?? "item"}-${index}`} style={styles.adminItem}>
            <View style={styles.adminItemInfo}>
              <Text style={styles.orderItemName}>
                {item?.product?.name ?? item?.name ?? "Producto"}
              </Text>

              <Text style={styles.orderItemQuantity}>
                x{item?.quantity ?? 1}
              </Text>
            </View>

            <View style={styles.adminItemActions}>
              <Text style={styles.orderItemPrice}>
                $
                {(
                  Number(item?.unitPrice ?? 0) * Number(item?.quantity ?? 1)
                ).toFixed(2)}
              </Text>

              {order.status !== "cancelado" && order.status !== "entregado" ? (
                <Pressable
                  style={styles.removeItemButton}
                  onPress={() => onRemoveItem(order, item?.id)}
                >
                  <Text style={styles.removeItemText}>Quitar</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>

        <Text style={styles.totalValue}>${Number(order.total).toFixed(2)}</Text>
      </View>

      <View style={styles.adminStatusSection}>
        <Text style={styles.sectionTitle}>Cambiar estado</Text>

        <View style={styles.statusButtons}>
          {STATUS_OPTIONS.map((status) => {
            const active = order.status === status;

            return (
              <Pressable
                key={status}
                style={[
                  styles.adminStatusButton,
                  active && styles.adminStatusButtonActive,
                  active && {
                    borderColor: statusColor(status),
                  },
                ]}
                onPress={() => onChangeStatus(order, status)}
              >
                <Text
                  style={[
                    styles.adminStatusButtonText,
                    active && {
                      color: statusColor(status),
                    },
                  ]}
                >
                  {statusLabel[status]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: menuColors.background,
  },

  screen: {
    flex: 1,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

  header: {
    paddingHorizontal: menuSpacing.lg,
    paddingTop: menuSpacing.lg,
    paddingBottom: menuSpacing.md,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: menuColors.textPrimary,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: menuColors.textSecondary,
  },

  listContent: {
    paddingHorizontal: menuSpacing.lg,
    paddingBottom: menuSpacing.xl,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: menuSpacing.lg,
  },

  loadingText: {
    marginTop: menuSpacing.md,
    fontSize: 15,
    color: menuColors.textSecondary,
  },

  emptyCard: {
    marginHorizontal: menuSpacing.lg,
    marginTop: menuSpacing.lg,
    padding: menuSpacing.xl,
    borderRadius: menuRadius.lg,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: menuColors.textPrimary,
  },

  emptyText: {
    marginTop: menuSpacing.sm,
    textAlign: "center",
    color: menuColors.textSecondary,
    lineHeight: 21,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: menuRadius.lg,
    padding: menuSpacing.lg,
    marginBottom: menuSpacing.md,
    borderWidth: 1,
    borderColor: "#E8E2DA",
  },

  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: menuSpacing.md,
  },

  orderHeaderText: {
    flex: 1,
  },

  orderNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: menuColors.textPrimary,
  },

  customerName: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    color: menuColors.textPrimary,
  },

  orderDate: {
    marginTop: 4,
    fontSize: 13,
    color: menuColors.textSecondary,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },

  trackerContainer: {
    marginTop: menuSpacing.lg,
    marginBottom: menuSpacing.lg,
    position: "relative",
    paddingTop: 2,
  },

  trackerLineBackground: {
    position: "absolute",
    left: "12.5%",
    right: "12.5%",
    top: 15,
    height: 3,
    backgroundColor: "#E5E1DA",
    borderRadius: 99,
  },

  trackerLineProgress: {
    position: "absolute",
    left: "12.5%",
    top: 15,
    height: 3,
    backgroundColor: menuColors.accent,
    borderRadius: 99,
  },

  trackerSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  trackerStep: {
    width: "25%",
    alignItems: "center",
  },

  trackerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D7D2CA",
    alignItems: "center",
    justifyContent: "center",
  },

  trackerCircleActive: {
    backgroundColor: menuColors.accent,
    borderColor: menuColors.accent,
  },

  trackerCircleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8B857D",
  },

  trackerCircleTextActive: {
    color: "#FFFFFF",
  },

  trackerLabel: {
    marginTop: 6,
    fontSize: 10,
    textAlign: "center",
    color: menuColors.textSecondary,
  },

  trackerLabelActive: {
    color: menuColors.textPrimary,
    fontWeight: "700",
  },

  cancelledBox: {
    marginTop: menuSpacing.lg,
    marginBottom: menuSpacing.lg,
    padding: menuSpacing.md,
    borderRadius: menuRadius.md,
    backgroundColor: "#FFF2F2",
    borderWidth: 1,
    borderColor: "#E7A2A2",
  },

  cancelledTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#B63E3E",
  },

  cancelledText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#7E3535",
  },

  noticeBox: {
    marginTop: menuSpacing.md,
    padding: menuSpacing.md,
    borderRadius: menuRadius.md,
    backgroundColor: "#F7F3EC",
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: menuColors.textPrimary,
  },

  noticeText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: menuColors.textSecondary,
  },

  itemsSection: {
    marginTop: menuSpacing.md,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: menuColors.textPrimary,
    marginBottom: menuSpacing.sm,
  },

  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECE6",
  },

  orderItemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  orderItemName: {
    flexShrink: 1,
    fontSize: 14,
    color: menuColors.textPrimary,
    fontWeight: "600",
  },

  orderItemQuantity: {
    fontSize: 13,
    color: menuColors.textSecondary,
  },

  orderItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: menuColors.textPrimary,
  },

  totalRow: {
    marginTop: menuSpacing.md,
    paddingTop: menuSpacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E8E2DA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: menuColors.textPrimary,
  },

  totalValue: {
    fontSize: 19,
    fontWeight: "900",
    color: menuColors.accent,
  },

  cancelOrderButton: {
    marginTop: menuSpacing.md,
    minHeight: 44,
    borderRadius: menuRadius.md,
    borderWidth: 1,
    borderColor: "#C94C4C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: menuSpacing.md,
  },

  cancelOrderButtonPressed: {
    opacity: 0.7,
  },

  cancelOrderButtonText: {
    color: "#C94C4C",
    fontSize: 14,
    fontWeight: "800",
  },

  adminStatusSection: {
    marginTop: menuSpacing.lg,
  },

  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  adminStatusButton: {
    borderWidth: 1,
    borderColor: "#D8D2CA",
    borderRadius: menuRadius.md,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
  },

  adminStatusButtonActive: {
    backgroundColor: "#F5F1EA",
  },

  adminStatusButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: menuColors.textSecondary,
  },

  adminItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECE6",
  },

  adminItemInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  adminItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  removeItemButton: {
    borderWidth: 1,
    borderColor: "#C94C4C",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  removeItemText: {
    color: "#C94C4C",
    fontSize: 11,
    fontWeight: "800",
  },
});
