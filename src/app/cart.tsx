import {
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

export default function CartScreen(){
    const{
        cartItems,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        totalItems,
        totalPrice,
    } = useCart();

    return (
       <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
            <Text style={styles.title}>Mi carrito</Text>

            <Text style={styles.subtitle}>
                {totalItems} {totalItems === 1 ? "producto" : "productos"}
            </Text>
        </View>

        {cartItems.length === 0 ? (
            <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🛒</Text>

                <Text style={styles.emptyTitle}>
                    Tu carrito está vacío
                </Text>

                <Text style={styles.emptyText}>
                    Agrega productos del menú para realizar un pedido
                </Text>
            </View>
        ) : (
            <>

                <FlatList
                    data={cartItems}
                    keyExtractor={(item) => item.product.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.cartItem}>
                            <View style={styles.productInfo}>
                                <Text style={styles.emoji}>
                                    {item.product.emoji}
                                </Text>

                                <View style={styles.productText}>
                                    <Text style={styles.productName}>
                                        {item.product.name}
                                    </Text>

                                    <Text style={styles.productPrice}>
                                        ${item.product.price.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.quantityRow}>
                                <Pressable
                                    style={styles.quantityButton}
                                    onPress={() =>
                                        decreaseQuantity(item.product.id)
                                    }
                                >
                                    <Text style={styles.quantityButtonText}>

                                        -

                                    </Text>
                                </Pressable>

                                <Text style={styles.quantity}>
                                    {item.quantity}    
                                </Text>

                                <Pressable
                                    style={styles.quantityButton}
                                    onPress={() =>
                                        increaseQuantity(item.product.id)
                                    }
                                >
                                    <Text style={styles.quantityButtonText}>

                                        +

                                    </Text>
                                </Pressable>    
                            </View>

                            <Pressable
                                onPress={() =>
                                    removeFromCart(item.product.id)
                                }
                            >

                            <Text style={styles.removeText}>
                                Eliminar
                            </Text>

                            </Pressable>    
                        </View>
                    )}
                />

                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                            Total
                        </Text>

                        <Text style={styles.totalPrice}>
                            ${totalPrice.toFixed(2)}
                        </Text>
                    </View>

                    <Pressable style={styles.orderButton}>
                        <Text style={styles.orderButtonText}>
                            Realizar pedido
                        </Text>
                    </Pressable>
                </View>    
            </>
        )}
       </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen:{
        flex: 1,
        backgroundColor: menuColors.background,
    },
    header:{
        paddingHorizontal: menuSpacing.lg,
        paddingVertical: menuSpacing.md,
    },
    title:{
        ...menuTypography.title,
        fontSize: 26,
        color: menuColors.textPrimary,
    },
    subtitle: {
        ...menuTypography.body,
        color: menuColors.textSecondary,
        marginTop: 4,
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
    emptyTitle:{
        ...menuTypography.subtitle,
        fontSize: 20,
        color: menuColors.textPrimary,
        marginBottom: menuSpacing.sm,
    },
    emptyText:{
        ...menuTypography.body,
        color: menuColors.textSecondary,
        textAlign: "center",
    },
    list:{
        padding: menuSpacing.md,
        paddingBottom: 180,
    },
    cartItem:{
        backgroundColor: menuColors.surface,
        borderRadius: menuRadius.lg,
        padding: menuSpacing.md,
        marginBottom: menuSpacing.sm
    },
    productInfo:{
        flexDirection: "row",
        alignItems: "center"
    },
    emoji:{
        fontSize: 42,
        marginRight: menuSpacing.md,
    },
    productText:{
        flex: 1,
    },
    productName:{
        ...menuTypography.subtitle,
        color: menuColors.textPrimary,
    },
    productPrice:{
        ...menuTypography.body,
        color: menuColors.textSecondary,
        marginTop: 3,
    },
    quantityRow:{
        flexDirection: "row",
        alignItems: "center",
        marginTop: menuSpacing.md,
    },
    quantityButton:{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: menuColors.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    quantityButtonText:{
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "bold",
    },
    quantity:{
        marginHorizontal: menuSpacing.md,
        fontSize: 17,
        fontWeight: "bold",
        color: menuColors.textPrimary,
    },
    removeText:{
        marginTop: menuSpacing.sm,
        color: menuColors.danger,
        fontWeight: "bold",
    },
    footer:{
        padding: menuSpacing.lg,
        backgroundColor: menuColors.surface,
        borderTopWidth: 1,
        borderColor: menuColors.border,
    },
    totalRow:{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom:menuSpacing.md,
    },
    totalLabel:{
        fontSize: 20,
        fontWeight: "bold",
        color: menuColors.textPrimary,
    },
    totalPrice:{
        fontSize: 22,
        fontWeight: "bold",
        color: menuColors.price,
    },
    orderButton:{
        backgroundColor: menuColors.accent,
        paddingVertical: menuSpacing.md,
        borderRadius: menuRadius.md,
        alignItems: "center",
    },
    orderButtonText:{
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16,
    },
})