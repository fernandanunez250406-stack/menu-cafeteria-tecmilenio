import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
} from "../../constants/menuTheme";
import { MenuItem } from "../../types/menu";

// Props = información y funciones que recibe este componente.
type Props = {
  item: MenuItem;
  onPress: () => void;
  onAddToCart: () => void;
  onToggleAvailability: () => void;
};

export default function ProductCard({
  item,
  onPress,
  onAddToCart,
  onToggleAvailability,
}: Props) {
  return (
    <View style={styles.card}>
      {/* 
        Esta parte de la tarjeta se puede presionar.
        Al hacerlo, ejecuta onPress().
      */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.productContent,

          // Cuando el usuario mantiene presionada la tarjeta,
          // se hace un pequeño efecto de escala.
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.imageWrap}>
          {/* 
            Si el producto tiene una imagen, mostramos la imagen.
            Si no tiene, mostramos el emoji.
          */}
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.photo} />
          ) : (
            <Text style={styles.emoji}>{item.emoji}</Text>
          )}

          {/* Precio del producto */}
          <View style={styles.priceSticker}>
            <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
          </View>
        </View>

        {/* Nombre del producto */}
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Descripción del producto */}
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </Pressable>

      {/* 
        Botón para agregar productos al carrito.

        Si el producto está disponible:
        - Se puede presionar.
        - Ejecuta onAddToCart().

        Si no está disponible:
        - El botón queda deshabilitado.
      */}
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

      {/* 
        Por ahora dejamos este botón para controlar
        la disponibilidad del producto.

        Más adelante, cuando separemos cliente y administrador,
        este botón solamente será visible para el administrador.
      */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal de cada tarjeta.
  card: {
    flex: 1,
    backgroundColor: menuColors.surface,
    borderRadius: menuRadius.lg,
    padding: menuSpacing.sm,
    margin: menuSpacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  // Parte principal del contenido del producto.
  productContent: {
    flex: 1,
  },

  // Contenedor de la imagen o emoji.
  imageWrap: {
    position: "relative",
    borderRadius: menuRadius.md,
    overflow: "hidden",
    aspectRatio: 1,
    marginBottom: menuSpacing.sm,
    backgroundColor: menuColors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tamaño del emoji cuando no hay imagen.
  emoji: {
    fontSize: 56,
  },

  // Imagen del producto.
  photo: {
    width: "100%",
    height: "100%",
  },

  // Etiqueta que muestra el precio.
  priceSticker: {
    position: "absolute",
    bottom: menuSpacing.sm,
    right: menuSpacing.sm,
    backgroundColor: menuColors.price,
    borderRadius: menuRadius.pill,
    paddingHorizontal: menuSpacing.sm,
    paddingVertical: 4,
  },

  // Texto del precio.
  priceText: {
    ...menuTypography.price,
    color: "#fff",
  },

  // Nombre del producto.
  name: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
    marginBottom: 2,
  },

  // Descripción del producto.
  description: {
    ...menuTypography.body,
    fontSize: 12,
    color: menuColors.textSecondary,
  },

  // Botón para agregar al carrito.
  cartButton: {
    marginTop: menuSpacing.sm,
    paddingVertical: 10,
    borderRadius: menuRadius.md,
    alignItems: "center",
    backgroundColor: menuColors.accent,
  },

  // Estilo cuando el producto no está disponible.
  cartButtonDisabled: {
    backgroundColor: "#9E9E9E",
  },

  // Texto del botón del carrito.
  cartButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },

  // Botón para cambiar disponibilidad.
  availabilityButton: {
    marginTop: menuSpacing.sm,
    paddingVertical: 8,
    borderRadius: menuRadius.md,
    alignItems: "center",
    backgroundColor: "#4CAF50",
  },

  // Color cuando el producto no está disponible.
  unavailableButton: {
    backgroundColor: "#E53935",
  },

  // Texto del botón de disponibilidad.
  availabilityText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});
