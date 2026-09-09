import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
} from "../../constants/menuTheme";
import { MenuItem } from "../../types/menu";

type Props = {
  item: MenuItem | null;
  visible: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
};

export default function ProductDetailModal({
  item,
  visible,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onAddToCart,
}: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      setJustAdded(false);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, item?.id]);

  if (!item) return null;

  const handleAddToCart = () => {
    onAddToCart(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.imageWrap}>
              {item.photoUri ? (
                <Animated.Image
                  source={{ uri: item.photoUri }}
                  style={[styles.photo, { transform: [{ scale }] }]}
                />
              ) : (
                <Animated.Text
                  style={[styles.emoji, { transform: [{ scale }] }]}
                >
                  {item.emoji}
                </Animated.Text>
              )}
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
              <View style={styles.priceSticker}>
                <Text style={styles.priceText}>${item.price}</Text>
              </View>
            </View>

            <View style={styles.content}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>

              {(item.specs ?? []).length > 0 && (
                <View style={styles.specsBlock}>
                  <Text style={styles.sectionLabel}>ESPECIFICACIONES</Text>
                  {item.specs!.map((spec, i) => (
                    <View key={i} style={styles.specRow}>
                      <Text style={styles.specLabel}>{spec.label}</Text>
                      <Text style={styles.specValue}>{spec.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {isAdmin ? (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => onEdit(item)}
                  >
                    <Text style={styles.editButtonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => onDelete(item)}
                  >
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </Pressable>
                </View>
              ) : item.available ? (
                <Pressable
                  style={[
                    styles.addToCartButton,
                    justAdded && styles.addToCartButtonAdded,
                  ]}
                  onPress={handleAddToCart}
                  disabled={justAdded}
                >
                  <Text style={styles.addToCartButtonText}>
                    {justAdded ? "✓ Agregado al carrito" : "Agregar al carrito"}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.unavailableTag}>
                  <Text style={styles.unavailableTagText}>No disponible</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: menuColors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: menuColors.background,
    borderTopLeftRadius: menuRadius.lg,
    borderTopRightRadius: menuRadius.lg,
    maxHeight: "90%",
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1.6,
    borderTopLeftRadius: menuRadius.lg,
    borderTopRightRadius: menuRadius.lg,
    overflow: "hidden",
    backgroundColor: menuColors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 96,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: menuSpacing.md,
    left: menuSpacing.md,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  priceSticker: {
    position: "absolute",
    bottom: menuSpacing.md,
    right: menuSpacing.md,
    backgroundColor: menuColors.price,
    borderRadius: menuRadius.pill,
    paddingHorizontal: menuSpacing.md,
    paddingVertical: 6,
  },
  priceText: {
    ...menuTypography.price,
    fontSize: 18,
    color: "#fff",
  },
  content: {
    padding: menuSpacing.lg,
  },
  name: {
    ...menuTypography.title,
    color: menuColors.textPrimary,
    marginBottom: menuSpacing.sm,
  },
  description: {
    ...menuTypography.body,
    fontSize: 14,
    lineHeight: 20,
    color: menuColors.textSecondary,
    marginBottom: menuSpacing.lg,
  },
  specsBlock: {
    marginBottom: menuSpacing.lg,
  },
  sectionLabel: {
    ...menuTypography.label,
    color: menuColors.textSecondary,
    marginBottom: menuSpacing.sm,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: menuColors.border,
  },
  specLabel: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
  },
  specValue: {
    ...menuTypography.body,
    fontWeight: "600",
    color: menuColors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    gap: menuSpacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: menuColors.accent,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: menuColors.dangerSoft,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
    alignItems: "center",
  },
  deleteButtonText: {
    color: menuColors.danger,
    fontWeight: "700",
  },
  addToCartButton: {
    backgroundColor: menuColors.accent,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
    alignItems: "center",
  },
  addToCartButtonAdded: {
    backgroundColor: "#4CAF50",
  },
  addToCartButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  unavailableTag: {
    backgroundColor: "#E0E0E0",
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
    alignItems: "center",
  },
  unavailableTagText: {
    color: "#6B6B6B",
    fontWeight: "700",
    fontSize: 15,
  },
});
