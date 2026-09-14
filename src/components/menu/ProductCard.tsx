import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import {
  menuRadius,
  menuSpacing,
  menuTypography,
} from "../../constants/menuTheme";

import { MenuItem } from "../../types/menu";

type Props = {
  item: MenuItem;
  isAdmin: boolean;
  onPress: () => void;
  onAddToCart: () => void;
  onToggleAvailability: () => void;
};

export default function ProductCard({
  item,
  isAdmin,
  onPress,
  onAddToCart,
  onToggleAvailability,
}: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.productContent,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        {/* Imagen o emoji */}
        <View style={styles.imageWrap}>
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.photo} />
          ) : (
            <Text style={styles.emoji}>{item.emoji}</Text>
          )}

          {/* Precio */}
          <View style={styles.priceSticker}>
            <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
          </View>
        </View>

        {/* Nombre */}
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Descripción */}
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </Pressable>

      {/* Acciones */}
      {isAdmin ? (
        <Pressable
          style={[
            styles.availabilityButton,
            !item.available && styles.unavailableButton,
          ]}
          onPress={onToggleAvailability}
        >
          <Text style={styles.availabilityText}>
            {item.available ? "Disponible" : "No disponible"}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={[
            styles.cartButton,
            !item.available && styles.cartButtonDisabled,
          ]}
          onPress={onAddToCart}
          disabled={!item.available}
        >
          <Text style={styles.cartButtonText}>
            {item.available ? "Añadir +" : "No disponible"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Tarjeta del producto
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: menuRadius.lg,
    padding: menuSpacing.sm,
    margin: menuSpacing.sm,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  // Contenido principal
  productContent: {
    flex: 1,
  },

  // Imagen / emoji
  imageWrap: {
    position: "relative",
    borderRadius: menuRadius.md,
    overflow: "hidden",
    aspectRatio: 1,
    marginBottom: menuSpacing.sm,

    backgroundColor: "#F7F3EE",

    alignItems: "center",
    justifyContent: "center",
  },

  // Emoji
  emoji: {
    fontSize: 56,
  },

  // Imagen
  photo: {
    width: "100%",
    height: "100%",
  },

  // Precio
  priceSticker: {
    position: "absolute",
    bottom: menuSpacing.sm,
    right: menuSpacing.sm,

    backgroundColor: "#7A4B2A",

    borderRadius: menuRadius.pill,
    paddingHorizontal: menuSpacing.sm,
    paddingVertical: 4,
  },

  // Texto del precio
  priceText: {
    ...menuTypography.price,
    color: "#FFFFFF",
  },

  // Nombre
  name: {
    ...menuTypography.subtitle,
    color: "#222222",
    marginBottom: 2,
  },

  // Descripción
  description: {
    ...menuTypography.body,
    fontSize: 12,
    color: "#666666",
  },

  // Botón añadir
  cartButton: {
    marginTop: menuSpacing.sm,
    paddingVertical: 10,

    borderRadius: menuRadius.md,

    alignItems: "center",

    backgroundColor: "#7A4B2A",
  },

  // Producto no disponible
  cartButtonDisabled: {
    backgroundColor: "#F1F1F1",
  },

  // Texto botón añadir
  cartButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },

  // Botón de disponibilidad para admin
  availabilityButton: {
    marginTop: menuSpacing.sm,
    paddingVertical: 8,

    borderRadius: menuRadius.md,

    alignItems: "center",

    backgroundColor: "#7A4B2A",
  },

  // No disponible para admin
  unavailableButton: {
    backgroundColor: "#FCECEC",
  },

  // Texto disponibilidad
  availabilityText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
});
