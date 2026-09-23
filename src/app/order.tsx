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
          <View style={styles.emptyIndicator}>
            <View style={styles.emptyIndicatorInner} />
          </View>

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

                {isCancelled ? (
                  <CancelledOrderStatus reason={item.cancellationReason} />
                ) : (
                  <CustomerStatusTracker status={item.status} />
                )}

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
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>
                            {cartItem.quantity}x{" "}
                            {cartItem.product?.name ?? "Producto"}
                          </Text>

                          <OrderCustomizationDetails cartItem={cartItem} />
                        </View>

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
   DETALLES DE PERSONALIZACIÓN DEL PEDIDO
   ========================================================= */

function OrderCustomizationDetails({ cartItem }: { cartItem: any }) {
  const customizations = Array.isArray(cartItem?.customizations)
    ? cartItem.customizations
    : [];

  if (customizations.length === 0) {
    return null;
  }

  return (
    <View style={styles.customizationsContainer}>
      {customizations.map((customization: any, index: number) => {
        const specLabel = customization?.specLabel ?? "Personalización";

        const optionLabel = customization?.optionLabel ?? "Opción seleccionada";

        const price = Number(customization?.price ?? 0);

        return (
          <View
            key={customization?.optionId ?? `${specLabel}-${index}`}
            style={styles.customizationRow}
          >
            <Text style={styles.customizationLabel}>{specLabel}</Text>

            <Text style={styles.customizationValue}>
              {optionLabel}

              {price > 0 ? ` (+$${price.toFixed(2)})` : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* =========================================================
   SEGUIMIENTO DEL PEDIDO DEL CLIENTE
   ========================================================= */

const CUSTOMER_STATUS_STEPS: {
  status: OrderStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "pendiente",
    label: "Recibido",
    description: "Tu pedido fue recibido correctamente.",
  },
  {
    status: "preparando",
    label: "Preparando",
    description: "Estamos preparando tu pedido.",
  },
  {
    status: "listo",
    label: "Listo",
    description: "Tu pedido está listo para recoger.",
  },
  {
    status: "entregado",
    label: "Entregado",
    description: "Tu pedido fue entregado.",
  },
];

function CustomerStatusTracker({ status }: { status: OrderStatus }) {
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const opacityAnimation = useRef(new Animated.Value(1)).current;

  const progressAnimation = useRef(new Animated.Value(0)).current;

  const currentIndex = CUSTOMER_STATUS_STEPS.findIndex(
    (step) => step.status === status,
  );

  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  const progressPercentage =
    (safeIndex / (CUSTOMER_STATUS_STEPS.length - 1)) * 100;

  useEffect(() => {
    pulseAnimation.setValue(1);
    opacityAnimation.setValue(1);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnimation, {
            toValue: 1.04,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.timing(opacityAnimation, {
            toValue: 0.72,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulse.start();

    Animated.timing(progressAnimation, {
      toValue: progressPercentage,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      pulse.stop();
    };
  }, [
    status,
    progressPercentage,
    pulseAnimation,
    opacityAnimation,
    progressAnimation,
  ]);

  return (
    <View style={styles.statusTrackerContainer}>
      <View style={styles.trackerHeader}>
        <View style={styles.trackerHeaderInfo}>
          <Text style={styles.trackerTitle}>
            {CUSTOMER_STATUS_STEPS[safeIndex].label}
          </Text>

          <Text style={styles.trackerDescription}>
            {CUSTOMER_STATUS_STEPS[safeIndex].description}
          </Text>
        </View>

        <View style={styles.liveIndicator}>
          <Animated.View
            style={[
              styles.liveDot,
              {
                opacity: opacityAnimation,
              },
            ]}
          />

          <Text style={styles.liveIndicatorText}>Actualizado</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressLineBackground} />

        <Animated.View
          style={[
            styles.progressLine,
            {
              width: progressAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />

        <View style={styles.statusStepsRow}>
          {CUSTOMER_STATUS_STEPS.map((step, index) => {
            const isCompleted = index < safeIndex;

            const isCurrent = index === safeIndex;

            return (
              <View key={step.status} style={styles.statusStep}>
                <View style={styles.statusNodeClip}>
                  {isCurrent ? (
                    <Animated.View
                      style={[
                        styles.statusNodeOuter,
                        {
                          transform: [
                            {
                              scale: pulseAnimation,
                            },
                          ],
                        },
                      ]}
                    >
                      <View style={styles.statusNodeCurrent} />
                    </Animated.View>
                  ) : (
                    <View
                      style={[
                        styles.statusNode,
                        isCompleted && styles.statusNodeCompleted,
                      ]}
                    >
                      {isCompleted && <View style={styles.statusNodeCheck} />}
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.statusStepLabel,
                    (isCompleted || isCurrent) && styles.statusStepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   ESTADO CANCELADO
   ========================================================= */

function CancelledOrderStatus({ reason }: { reason?: string }) {
  return (
    <View style={styles.cancelledContainer}>
      <View style={styles.cancelledIndicator}>
        <View style={styles.cancelledIndicatorLine} />
      </View>

      <View style={styles.cancelledContent}>
        <Text style={styles.cancelledTitle}>Pedido cancelado</Text>

        <Text style={styles.cancelledText}>
          {reason ?? "Este pedido fue cancelado."}
        </Text>
      </View>
    </View>
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
          <View style={styles.emptyIndicator}>
            <View style={styles.emptyIndicatorInner} />
          </View>

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

              {item.status === "cancelado" && item.cancellationReason && (
                <View style={styles.cancellationNotice}>
                  <Text style={styles.cancellationTitle}>Pedido cancelado</Text>

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

                          <OrderCustomizationDetails cartItem={cartItem} />

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

/* =========================================================
   STATUS PILL
   ========================================================= */

function StatusPill({ status }: { status: string }) {
  const isCancelled = status === "cancelado";

  return (
    <View
      style={[styles.statusPill, isCancelled && styles.statusPillCancelled]}
    >
      <Text
        style={[
          styles.statusPillText,
          isCancelled && styles.statusPillTextCancelled,
        ]}
      >
        {statusLabel(status)}
      </Text>
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
    minWidth: 0,
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
    flexShrink: 0,
  },

  statusPillCancelled: {
    backgroundColor: "#F5E3DD",
  },

  statusPillText: {
    color: menuColors.accent,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
  },

  statusPillTextCancelled: {
    color: "#9A5140",
  },

  date: {
    marginTop: 6,
    color: menuColors.textSecondary,
    fontSize: 12,
  },

  /* =======================================================
     SEGUIMIENTO DEL CLIENTE
     ======================================================= */

  statusTrackerContainer: {
    marginTop: menuSpacing.md,
    padding: menuSpacing.md,
    borderRadius: menuRadius.md,
    backgroundColor: "#F8F5F1",
    borderWidth: 1,
    borderColor: menuColors.border,

    // Importante para Web:
    // evita que la animación pueda pintar
    // fuera del recuadro.
    overflow: "hidden",
  },

  trackerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: menuSpacing.md,
  },

  trackerHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },

  trackerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: menuColors.textPrimary,
  },

  trackerDescription: {
    fontSize: 12,
    color: menuColors.textSecondary,
    marginTop: 3,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: 8,
    flexShrink: 0,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: menuColors.accent,
  },

  liveIndicatorText: {
    fontSize: 10,
    fontWeight: "600",
    color: menuColors.textSecondary,
  },

  progressContainer: {
    height: 68,
    position: "relative",
    overflow: "hidden",
    paddingHorizontal: 10,
  },

  progressLineBackground: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 11,
    height: 3,
    borderRadius: 3,
    backgroundColor: menuColors.border,
  },

  progressLine: {
    position: "absolute",
    left: 10,
    top: 11,
    height: 3,
    borderRadius: 3,
    backgroundColor: menuColors.accent,
  },

  statusStepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  statusStep: {
    width: "24%",
    alignItems: "center",
  },

  // Contenedor que recorta el pequeño pulso
  // del nodo actual sin afectar el tracker completo.
  statusNodeClip: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  statusNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: menuColors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  statusNodeCompleted: {
    backgroundColor: menuColors.accent,
    borderColor: menuColors.accent,
  },

  statusNodeCheck: {
    width: 8,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FFFFFF",
    transform: [
      {
        rotate: "-45deg",
      },
    ],
    marginTop: -2,
  },

  statusNodeOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: menuColors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  statusNodeCurrent: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: menuColors.accent,
  },

  statusStepLabel: {
    fontSize: 10,
    color: menuColors.textSecondary,
    marginTop: 7,
    textAlign: "center",
    fontWeight: "600",
  },

  statusStepLabelActive: {
    color: menuColors.accent,
    fontWeight: "700",
  },

  /* =======================================================
     CANCELACIÓN
     ======================================================= */

  cancelledContainer: {
    marginTop: menuSpacing.md,
    padding: menuSpacing.md,
    borderRadius: menuRadius.md,
    backgroundColor: "#F5E3DD",
    borderWidth: 1,
    borderColor: "#D39A88",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  cancelledIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9A5140",
    alignItems: "center",
    justifyContent: "center",
    marginRight: menuSpacing.sm,
  },

  cancelledIndicatorLine: {
    width: 10,
    height: 2,
    backgroundColor: "#9A5140",
    borderRadius: 2,
  },

  cancelledContent: {
    flex: 1,
  },

  cancelledTitle: {
    color: "#9A5140",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  cancelledText: {
    color: "#795548",
    fontSize: 13,
    lineHeight: 19,
  },

  /* =======================================================
     AVISOS
     ======================================================= */

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

  /* =======================================================
     PRODUCTOS
     ======================================================= */

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
    alignItems: "flex-start",
    marginBottom: 12,
  },

  productInfo: {
    flex: 1,
    marginRight: menuSpacing.sm,
    minWidth: 0,
  },

  productName: {
    color: menuColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  productPrice: {
    color: menuColors.textSecondary,
    fontSize: 14,
    marginTop: 5,
  },

  noProductsText: {
    color: menuColors.textSecondary,
    fontSize: 13,
    paddingVertical: 4,
  },

  /* =======================================================
     PERSONALIZACIONES
     ======================================================= */

  customizationsContainer: {
    marginTop: 6,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: menuColors.accentSoft,
    gap: 3,
  },

  customizationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },

  customizationLabel: {
    color: menuColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 5,
  },

  customizationValue: {
    color: menuColors.textPrimary,
    fontSize: 12,
    fontWeight: "500",
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

  /* =======================================================
     TOTAL
     ======================================================= */

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

  /* =======================================================
     ADMIN - ESTADOS
     ======================================================= */

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

  /* =======================================================
     VACÍO
     ======================================================= */

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: menuSpacing.xl,
  },

  emptyIndicator: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: menuColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: menuSpacing.md,
  },

  emptyIndicatorInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: menuColors.accentSoft,
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
