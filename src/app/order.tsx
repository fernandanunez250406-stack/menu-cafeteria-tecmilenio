import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
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
  removeOrderItem,
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

/* =========================================================
   ALERTAS COMPATIBLES CON WEB Y MÓVIL
========================================================= */

function showMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

function askConfirmation(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = "Aceptar",
) {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(`${title}\n\n${message}`);

    if (confirmed) {
      onConfirm();
    }

    return;
  }

  Alert.alert(title, message, [
    {
      text: "Cancelar",
      style: "cancel",
    },
    {
      text: confirmText,
      style: "destructive",
      onPress: onConfirm,
    },
  ]);
}

/* =========================================================
   VISTA PRINCIPAL
========================================================= */

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
          renderItem={({ item }) => {
            const isCancelled = item.status === "cancelado";

            return (
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

                {/* AVISO DE CANCELACIÓN */}

                {isCancelled && item.cancellationReason && (
                  <View style={styles.cancellationNotice}>
                    <Text style={styles.cancellationTitle}>
                      ⚠️ Pedido cancelado
                    </Text>

                    <Text style={styles.cancellationText}>
                      {item.cancellationReason}
                    </Text>
                  </View>
                )}

                {/* AVISO GENERAL */}

                {!isCancelled && item.notice && (
                  <View style={styles.notice}>
                    <Text style={styles.noticeText}>{item.notice}</Text>
                  </View>
                )}

                <View style={styles.productsContainer}>
                  {item.items.length === 0 ? (
                    <Text style={styles.noProductsText}>
                      No hay productos en este pedido.
                    </Text>
                  ) : (
                    item.items.map((cartItem: any) => (
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
                    ))
                  )}
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>

                  <Text style={styles.total}>
                    ${Number(item.total).toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          }}
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

  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

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

  /* =========================================================
     CAMBIAR ESTADO
  ========================================================= */

  const handleChangeStatus = async (
    order: BackendOrder,
    status: OrderStatus,
  ) => {
    if (status === order.status) {
      return;
    }

    const statusOrder: OrderStatus[] = [
      "pendiente",
      "preparando",
      "listo",
      "entregado",
    ];

    const currentIndex = statusOrder.indexOf(order.status);

    const newIndex = statusOrder.indexOf(status);

    const isGoingBackward =
      currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex;

    /*
     * Si el administrador quiere regresar el estado,
     * pedimos confirmación.
     */
    if (isGoingBackward) {
      const currentLabel = statusLabel(order.status);

      const newLabel = statusLabel(status);

      askConfirmation(
        "¿Regresar estado del pedido?",
        `El pedido #${
          order.authCode ?? "—"
        } cambiará de "${currentLabel}" a "${newLabel}".\n\n¿Seguro que quieres hacerlo?`,
        () => {
          void performStatusUpdate(order, status);
        },
        "Sí, regresar",
      );

      return;
    }

    /*
     * Los cambios normales se realizan directamente.
     */
    await performStatusUpdate(order, status);
  };

  const performStatusUpdate = async (
    order: BackendOrder,
    status: OrderStatus,
  ) => {
    setUpdatingId(order.id);

    try {
      const updated = await updateOrderStatus(order.id, status);

      setOrders((current) =>
        current.map((item) => (item.id === order.id ? updated : item)),
      );
    } catch (error) {
      console.error("Error al cambiar el estado del pedido:", error);

      showMessage("Error", "No se pudo cambiar el estado del pedido.");
    } finally {
      setUpdatingId(null);
    }
  };

  /* =========================================================
     ELIMINAR PRODUCTO DE UNA ORDEN
  ========================================================= */

  const handleRemoveItem = (order: BackendOrder, cartItem: any) => {
    const itemId = cartItem?.id;

    if (!itemId) {
      showMessage(
        "Error",
        "Este producto no tiene un ID válido y no se puede eliminar.",
      );

      return;
    }

    const productName = cartItem.product?.name ?? "este producto";

    const isLastProduct =
      Array.isArray(order.items) && order.items.length === 1;

    const message = isLastProduct
      ? `¿Seguro que quieres quitar "${productName}" del pedido #${
          order.authCode ?? "—"
        }?\n\nEste es el último producto del pedido. Al quitarlo, el pedido se cancelará automáticamente por falta de stock.`
      : `¿Seguro que quieres quitar "${productName}" del pedido #${
          order.authCode ?? "—"
        }?\n\nEl total del pedido se actualizará automáticamente.`;

    askConfirmation(
      isLastProduct ? "Cancelar pedido" : "¿Quitar producto?",
      message,
      () => {
        void performRemoveItem(order, itemId);
      },
      isLastProduct ? "Sí, cancelar pedido" : "Sí, quitar",
    );
  };

  const performRemoveItem = async (order: BackendOrder, itemId: string) => {
    const itemKey = `${order.id}-${itemId}`;

    setRemovingItemId(itemKey);

    try {
      const updated = await removeOrderItem(order.id, itemId);

      setOrders((current) =>
        current.map((item) => (item.id === order.id ? updated : item)),
      );

      /*
       * Si era el último producto,
       * el backend cancela automáticamente
       * el pedido.
       */
      if (updated.status === "cancelado") {
        showMessage(
          "Pedido cancelado",
          "El último producto fue retirado y el pedido se canceló por falta de stock.",
        );
      }
    } catch (error) {
      console.error("Error al eliminar producto del pedido:", error);

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto del pedido.";

      showMessage("No se pudo eliminar", message);
    } finally {
      setRemovingItemId(null);
    }
  };

  /* =========================================================
     RENDER ADMIN
  ========================================================= */

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos de clientes</Text>

        <Text style={styles.subtitle}>
          Cambia el estado y administra los productos del pedido
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

              {/* AVISO DE CANCELACIÓN PARA ADMIN */}

              {item.status === "cancelado" && item.cancellationReason && (
                <View style={styles.cancellationNotice}>
                  <Text style={styles.cancellationTitle}>
                    ⚠️ Pedido cancelado
                  </Text>

                  <Text style={styles.cancellationText}>
                    {item.cancellationReason}
                  </Text>
                </View>
              )}

              <View style={styles.productsContainer}>
                {item.items.length === 0 ? (
                  <Text style={styles.noProductsText}>
                    No hay productos en este pedido.
                  </Text>
                ) : (
                  item.items.map((cartItem: any) => {
                    const itemKey = `${item.id}-${cartItem.id}`;

                    const isRemoving = removingItemId === itemKey;

                    return (
                      <View key={itemKey} style={styles.productRow}>
                        <View style={styles.productInfo}>
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

                        <Pressable
                          disabled={isRemoving}
                          onPress={() => handleRemoveItem(item, cartItem)}
                          style={({ pressed }) => [
                            styles.removeButton,
                            (pressed || isRemoving) && {
                              opacity: 0.6,
                            },
                          ]}
                        >
                          {isRemoving ? (
                            <ActivityIndicator
                              size="small"
                              color={menuColors.accent}
                            />
                          ) : (
                            <Text style={styles.removeButtonText}>Quitar</Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>

                <Text style={styles.total}>
                  ${Number(item.total).toFixed(2)}
                </Text>
              </View>

              {/* =================================================
                  SELECTOR DE ESTADO
              ================================================= */}

              <View style={styles.statusOptionsRow}>
                {STATUS_OPTIONS.map((option) => {
                  const isActive = option.value === item.status;

                  const isUpdating = updatingId === item.id;

                  /*
                   * IMPORTANTE:
                   * No bloqueamos los estados anteriores.
                   * Todos pueden seleccionarse.
                   */
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

/* =========================================================
   STATUS PILL
========================================================= */

function StatusPill({ status }: { status: string }) {
  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusPillText}>{statusLabel(status)}</Text>
    </View>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

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

  /* AVISO DE CANCELACIÓN */

  cancellationNotice: {
    marginTop: menuSpacing.md,
    padding: menuSpacing.md,
    borderRadius: menuRadius.md,
    borderWidth: 1,
    borderColor: menuColors.border,
    backgroundColor: menuColors.accentSoft,
  },

  cancellationTitle: {
    color: menuColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
  },

  cancellationText: {
    color: menuColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  notice: {
    marginTop: menuSpacing.md,
    padding: menuSpacing.sm,
    borderRadius: menuRadius.md,
    backgroundColor: menuColors.accentSoft,
  },

  noticeText: {
    color: menuColors.textSecondary,
    fontSize: 13,
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
    alignItems: "center",
    marginBottom: 8,
  },

  productInfo: {
    flex: 1,
    marginRight: menuSpacing.sm,
  },

  productName: {
    color: menuColors.textPrimary,
    fontSize: 14,
  },

  productPrice: {
    color: menuColors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },

  noProductsText: {
    color: menuColors.textSecondary,
    fontSize: 13,
    paddingVertical: 4,
  },

  removeButton: {
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.pill,
    paddingHorizontal: menuSpacing.sm,
    paddingVertical: 5,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },

  removeButtonText: {
    color: menuColors.accent,
    fontSize: 12,
    fontWeight: "700",
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
