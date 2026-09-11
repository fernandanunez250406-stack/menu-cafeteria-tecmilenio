import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MenuItem } from "../../types/menu";

type ProductDetailModalProps = {
  item: MenuItem | null;
  visible: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onAddToCart: (
    item: MenuItem,
    selectedOptions: Record<string, string>,
  ) => void;
};

export default function ProductDetailModal({
  item,
  visible,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  /**
   * Siempre trabajamos con un arreglo seguro.
   * Esto evita errores si Firebase todavía tiene
   * productos antiguos sin specs o con specs inválidas.
   */
  const specs = useMemo(() => {
    if (!item || !Array.isArray(item.specs)) {
      return [];
    }

    return item.specs.filter(
      (spec) =>
        spec &&
        typeof spec === "object" &&
        typeof spec.id === "string" &&
        typeof spec.label === "string" &&
        Array.isArray(spec.options) &&
        spec.options.length > 0,
    );
  }, [item]);

  /**
   * Cuando cambia el producto, seleccionamos automáticamente
   * la opción marcada como default.
   *
   * Si ninguna está marcada como default, usamos la primera.
   */
  useEffect(() => {
    if (!item) {
      setSelectedOptions({});
      return;
    }

    const defaultSelections: Record<string, string> = {};

    specs.forEach((spec) => {
      const defaultOption =
        spec.options.find((option) => option.isDefault) ?? spec.options[0];

      if (defaultOption) {
        defaultSelections[spec.id] = defaultOption.id;
      }
    });

    setSelectedOptions(defaultSelections);
  }, [item, specs]);

  /**
   * Selecciona una opción de una especificación.
   */
  const handleSelectOption = (specId: string, optionId: string) => {
    setSelectedOptions((current) => ({
      ...current,
      [specId]: optionId,
    }));
  };

  /**
   * Calcula el costo adicional de las personalizaciones.
   */
  const customizationPrice = useMemo(() => {
    return specs.reduce((total, spec) => {
      const selectedOptionId = selectedOptions[spec.id];

      if (!selectedOptionId) {
        return total;
      }

      const selectedOption = spec.options.find(
        (option) => option.id === selectedOptionId,
      );

      return total + (selectedOption?.price ?? 0);
    }, 0);
  }, [specs, selectedOptions]);

  /**
   * Precio final del producto.
   */
  const finalPrice = useMemo(() => {
    if (!item) {
      return 0;
    }

    return item.price + customizationPrice;
  }, [item, customizationPrice]);

  if (!item) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Botón cerrar */}
            <View style={styles.header}>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            {/* Emoji / imagen */}
            <View style={styles.imageContainer}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>

            {/* Información del producto */}
            <View style={styles.infoContainer}>
              <Text style={styles.productName}>{item.name}</Text>

              <Text style={styles.description}>{item.description}</Text>

              <Text style={styles.basePrice}>${item.price.toFixed(2)}</Text>
            </View>

            {/* Personalizaciones */}
            {specs.length > 0 && (
              <View style={styles.customizationContainer}>
                <Text style={styles.customizationTitle}>
                  Personaliza tu producto
                </Text>

                {specs.map((spec, specIndex) => {
                  /**
                   * Protección adicional por si llega información
                   * incorrecta desde Firebase.
                   */
                  if (
                    !spec ||
                    !Array.isArray(spec.options) ||
                    spec.options.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <View
                      key={spec.id || `spec-${specIndex}`}
                      style={styles.specContainer}
                    >
                      <Text style={styles.specLabel}>{spec.label}</Text>

                      <View style={styles.optionsContainer}>
                        {spec.options.map((option) => {
                          if (!option) {
                            return null;
                          }

                          const isSelected =
                            selectedOptions[spec.id] === option.id;

                          const optionPrice =
                            Number.isFinite(option.price) && option.price > 0
                              ? option.price
                              : 0;

                          return (
                            <Pressable
                              key={option.id}
                              style={[
                                styles.optionButton,
                                isSelected && styles.optionButtonSelected,
                              ]}
                              onPress={() =>
                                handleSelectOption(spec.id, option.id)
                              }
                            >
                              <View style={styles.optionInfo}>
                                <Text
                                  style={[
                                    styles.optionText,
                                    isSelected && styles.optionTextSelected,
                                  ]}
                                >
                                  {option.label}
                                </Text>

                                {optionPrice > 0 && (
                                  <Text
                                    style={[
                                      styles.optionPrice,
                                      isSelected && styles.optionPriceSelected,
                                    ]}
                                  >
                                    +${optionPrice.toFixed(2)}
                                  </Text>
                                )}
                              </View>

                              {isSelected && (
                                <Text style={styles.checkmark}>✓</Text>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Resumen de precio */}
            <View style={styles.priceSummary}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Precio base</Text>

                <Text style={styles.priceValue}>${item.price.toFixed(2)}</Text>
              </View>

              {customizationPrice > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Personalización</Text>

                  <Text style={styles.priceValue}>
                    +${customizationPrice.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>

                <Text style={styles.totalValue}>${finalPrice.toFixed(2)}</Text>
              </View>
            </View>

            {/* Botones de administrador */}
            {isAdmin && (
              <View style={styles.adminActions}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => onEdit(item)}
                >
                  <Text style={styles.editButtonText}>Editar producto</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => onDelete(item)}
                >
                  <Text style={styles.deleteButtonText}>Eliminar producto</Text>
                </Pressable>
              </View>
            )}

            {/* Agregar al carrito */}
            {!isAdmin && (
              <Pressable
                style={styles.addButton}
                onPress={() => onAddToCart(item, selectedOptions)}
              >
                <Text style={styles.addButtonText}>
                  Agregar al carrito · ${finalPrice.toFixed(2)}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 35,
  },

  header: {
    alignItems: "flex-end",
    marginBottom: 4,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    fontSize: 28,
    lineHeight: 30,
    color: "#333",
    fontWeight: "400",
  },

  imageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    backgroundColor: "#f7f3ee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emoji: {
    fontSize: 82,
  },

  infoContainer: {
    marginBottom: 24,
  },

  productName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    marginBottom: 14,
  },

  basePrice: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7a4b2a",
  },

  customizationContainer: {
    marginBottom: 20,
  },

  customizationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 18,
  },

  specContainer: {
    marginBottom: 20,
  },

  specLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },

  optionsContainer: {
    gap: 10,
  },

  optionButton: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },

  optionButtonSelected: {
    borderColor: "#7a4b2a",
    backgroundColor: "#f7f0ea",
  },

  optionInfo: {
    flex: 1,
  },

  optionText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },

  optionTextSelected: {
    color: "#7a4b2a",
    fontWeight: "700",
  },

  optionPrice: {
    marginTop: 3,
    fontSize: 13,
    color: "#777",
  },

  optionPriceSelected: {
    color: "#7a4b2a",
  },

  checkmark: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7a4b2a",
    marginLeft: 12,
  },

  priceSummary: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  priceLabel: {
    fontSize: 15,
    color: "#666",
  },

  priceValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },

  totalLabel: {
    fontSize: 18,
    color: "#222",
    fontWeight: "700",
  },

  totalValue: {
    fontSize: 22,
    color: "#7a4b2a",
    fontWeight: "700",
  },

  adminActions: {
    gap: 10,
    marginBottom: 15,
  },

  editButton: {
    backgroundColor: "#eee",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  deleteButton: {
    backgroundColor: "#fcecec",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c62828",
  },

  addButton: {
    backgroundColor: "#7a4b2a",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
