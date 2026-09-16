import {
  FlatList,
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

export default function ordersScreen(){
    const { orders } = useCart();

    return(
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>Mis pedidos</Text>
                
                <Text style={styles.subtitle}>
                    Consulta tus pedidos realizados
                </Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>📦</Text>

                    <Text style={styles.emptyTitle}>
                        Todavía no tienes pedidos
                    </Text>

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
                    renderItem={({ item }) => (
                        <View style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderTitle}>
                                    Pedido #{item.authCode}
                                </Text>

                                <Text style={styles.status}>{item.status}</Text>
                            </View>

                            <Text style={styles.date}>
                                {new Date(item.createdAt).toLocaleString()}
                            </Text>
                            <View style={styles.productsContainer}>
                                {item.items.map((cartItem) => (
                                    <View key={cartItem.id} style={styles.productRow}>
                                        <Text style={styles.productName}>
                                            {cartItem.quantity}x {cartItem.product.name}
                                        </Text>

                                        <Text style={styles.productPrice}>
                                            $
                                            {(
                                                cartItem.unitPrice * cartItem.quantity
                                            ).toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total</Text>

                                <Text style={styles.total}>
                                    ${item.total.toFixed(2)}
                                </Text>
                            </View> 
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
    alignItems: "center",
  },

  orderTitle: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
    fontWeight: "700",
  },

  status: {
    color: menuColors.accent,
    fontWeight: "700",
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