import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
} from "../constants/menuTheme";

import { useCart } from "../context/CartContext";

export default function CartScreen() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    totalItems,
    totalPrice,
    createLocalOrder,
  } = useCart();

  return (
    <SafeAreaView style={styles.screen}>
      {/* ENCABEZADO */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi carrito</Text>

        <Text style={styles.subtitle}>
          {totalItems} {totalItems === 1 ? "producto" : "productos"}
        </Text>
      </View>

      {/* CARRITO VACÍO */}
      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>

          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>

          <Text style={styles.emptyText}>
            Agrega productos del menú para realizar un pedido
          </Text>
        </View>
      ) : (
        <>
          {/* PRODUCTOS */}
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                {/* INFORMACIÓN PRINCIPAL */}
                <View style={styles.productInfo}>
                  <View style={styles.emojiContainer}>
                    <Text style={styles.emoji}>{item.product.emoji}</Text>
                  </View>

                  <View style={styles.productText}>
                    <Text style={styles.productName}>{item.product.name}</Text>

                    <Text style={styles.productPrice}>
                      ${item.unitPrice.toFixed(2)} c/u
                    </Text>
                  </View>
                </View>

                {/* PERSONALIZACIONES */}
                {item.customizations.length > 0 && (
                  <View style={styles.customizationsContainer}>
                    {item.customizations.map((customization) => (
                      <View
                        key={`${customization.specId}-${customization.optionId}`}
                        style={styles.customizationRow}
                      >
                        <Text style={styles.customizationLabel}>
                          {customization.specLabel}:
                        </Text>

                        <Text style={styles.customizationValue}>
                          {customization.optionLabel}
                        </Text>

                        {customization.price > 0 && (
                          <Text style={styles.customizationPrice}>
                            +${customization.price.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* CANTIDAD Y SUBTOTAL */}
                <View style={styles.quantityRow}>
                  <View style={styles.quantityControls}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.quantityButton,
                        pressed && styles.quantityButtonPressed,
                      ]}
                      onPress={() => decreaseQuantity(item.id)}
                    >
                      <Text style={styles.quantityButtonText}>−</Text>
                    </Pressable>

                    <Text style={styles.quantity}>{item.quantity}</Text>

                    <Pressable
                      style={({ pressed }) => [
                        styles.quantityButton,
                        pressed && styles.quantityButtonPressed,
                      ]}
                      onPress={() => increaseQuantity(item.id)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.itemSubtotal}>
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </Text>
                </View>

                {/* ELIMINAR */}
                <Pressable
                  onPress={() => removeFromCart(item.id)}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.removeButtonPressed,
                  ]}
                >
                  <Text style={styles.removeText}>Eliminar</Text>
                </Pressable>
              </View>
            )}
          />

          {/* RESUMEN */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>

              <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.orderButton,
                pressed && styles.orderButtonPressed,
              ]}
              onPress={() => {
                Alert.alert(
                  "Confirmar pedido",
                  `¿Deseas realizar le pedido por $${totalPrice.toFixed(2)}?`,
                  [
                    {
                      text: "Cancelar",
                      style: "cancel",
                    },
                    {
                      text: "Confirmar",
                      onPress: () => {
                        const order = createLocalOrder();

                        if(order){
                          Alert.alert(
                            "Pedido realizado",
                            `Tu pedido fue registrado. \nCódigo: ${order.authCode}`
                          );
                        }
                      },
                    },
                  ],
                );
              }}
            >
              <Text style={styles.orderButtonText}>Realizar pedido</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // =========================
  // PANTALLA
  // =========================

  screen: {
    flex: 1,
    backgroundColor: menuColors.background,
  },

  // =========================
  // ENCABEZADO
  // =========================

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

  // =========================
  // CARRITO VACÍO
  // =========================

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
    marginBottom: menuSpacing.sm,
  },

  emptyText: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    textAlign: "center",
  },

  // =========================
  // LISTA
  // =========================

  list: {
    paddingHorizontal: menuSpacing.md,
    paddingTop: menuSpacing.sm,
    paddingBottom: 180,
  },

  // =========================
  // PRODUCTO
  // =========================

  cartItem: {
    backgroundColor: menuColors.surface,
    borderRadius: menuRadius.lg,
    borderWidth: 1,
    borderColor: menuColors.border,
    padding: menuSpacing.md,
    marginBottom: menuSpacing.sm,
  },

  productInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  emojiContainer: {
    width: 58,
    height: 58,
    borderRadius: menuRadius.md,
    backgroundColor: menuColors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: menuSpacing.md,
  },

  emoji: {
    fontSize: 34,
  },

  productText: {
    flex: 1,
  },

  productName: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
    fontWeight: "700",
  },

  productPrice: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    marginTop: 3,
  },

  // =========================
  // PERSONALIZACIONES
  // =========================

  customizationsContainer: {
    marginTop: menuSpacing.md,
    padding: menuSpacing.sm,
    borderRadius: menuRadius.md,
    backgroundColor: menuColors.accentSoft,
  },

  customizationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 4,
  },

  customizationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: menuColors.textSecondary,
    marginRight: 4,
  },

  customizationValue: {
    fontSize: 13,
    fontWeight: "600",
    color: menuColors.textPrimary,
    flexShrink: 1,
  },

  customizationPrice: {
    fontSize: 12,
    color: menuColors.accent,
    fontWeight: "600",
    marginLeft: 5,
  },

  // =========================
  // CANTIDAD
  // =========================

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: menuSpacing.md,
  },

  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: menuColors.accentSoft,
    borderWidth: 1,
    borderColor: menuColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityButtonPressed: {
    opacity: 0.7,
  },

  quantityButtonText: {
    color: menuColors.accent,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },

  quantity: {
    marginHorizontal: menuSpacing.md,
    fontSize: 17,
    fontWeight: "700",
    color: menuColors.textPrimary,
  },

  itemSubtotal: {
    marginLeft: "auto",
    fontSize: 16,
    fontWeight: "700",
    color: menuColors.accent,
  },

  // =========================
  // ELIMINAR
  // =========================

  removeButton: {
    alignSelf: "flex-start",
    marginTop: menuSpacing.sm,
    paddingVertical: 4,
  },

  removeButtonPressed: {
    opacity: 0.6,
  },

  removeText: {
    color: menuColors.danger,
    fontWeight: "700",
    fontSize: 13,
  },

  // =========================
  // FOOTER
  // =========================

  footer: {
    padding: menuSpacing.lg,
    backgroundColor: menuColors.surface,
    borderTopWidth: 1,
    borderColor: menuColors.border,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: menuSpacing.md,
  },

  totalLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: menuColors.textPrimary,
  },

  totalPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: menuColors.accent,
  },

  // =========================
  // REALIZAR PEDIDO
  // =========================

  orderButton: {
    backgroundColor: menuColors.accent,
    paddingVertical: menuSpacing.md,
    borderRadius: menuRadius.md,
    alignItems: "center",
  },

  orderButtonPressed: {
    opacity: 0.85,
  },

  orderButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
