import { useEffect, useMemo, useState } from "react";

import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { WEB_MAX_WIDTH } from "../../constants/menuTheme";
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

  // =========================================================
  // ESPECIFICACIONES VÁLIDAS
  // =========================================================

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

  // =========================================================
  // ESTADO DE DISPONIBILIDAD
  // =========================================================

  const productAvailable = item?.available !== false;

  const specsWithAvailability = useMemo(() => {
    return specs.map((spec) => {
      const availableOptions = spec.options.filter(
        (option) => option && option.available !== false,
      );

      return {
        ...spec,
        availableOptions,
        hasAvailableOptions: availableOptions.length > 0,
      };
    });
  }, [specs]);

  const hasUnavailableOptions = useMemo(() => {
    return specs.some((spec) =>
      spec.options.some((option) => option && option.available === false),
    );
  }, [specs]);

  const hasUnavailableEntireSpec = useMemo(() => {
    return specsWithAvailability.some((spec) => !spec.hasAvailableOptions);
  }, [specsWithAvailability]);

  // =========================================================
  // SELECCIONES INICIALES
  // =========================================================

  useEffect(() => {
    if (!item) {
      setSelectedOptions({});
      return;
    }

    const defaultSelections: Record<string, string> = {};

    specs.forEach((spec) => {
      const availableOptions = spec.options.filter(
        (option) => option && option.available !== false,
      );

      if (availableOptions.length === 0) {
        return;
      }

      // Primero intentamos usar el default si está disponible.
      const defaultOption = availableOptions.find((option) => option.isDefault);

      // Si no existe default disponible, usamos la primera
      // opción disponible.
      const selectedOption = defaultOption ?? availableOptions[0];

      if (selectedOption) {
        defaultSelections[spec.id] = selectedOption.id;
      }
    });

    setSelectedOptions(defaultSelections);
  }, [item, specs]);

  // =========================================================
  // SELECCIONAR OPCIÓN
  // =========================================================

  const handleSelectOption = (specId: string, optionId: string) => {
    const spec = specs.find((currentSpec) => currentSpec.id === specId);

    if (!spec) {
      return;
    }

    const option = spec.options.find(
      (currentOption) => currentOption.id === optionId,
    );

    if (!option) {
      return;
    }

    // Una opción agotada nunca puede seleccionarse.
    if (option.available === false) {
      return;
    }

    setSelectedOptions((current) => ({
      ...current,
      [specId]: optionId,
    }));
  };

  // =========================================================
  // VALIDAR SELECCIONES
  // =========================================================

  const missingSelections = useMemo(() => {
    return specsWithAvailability.filter((spec) => {
      if (!spec.hasAvailableOptions) {
        return true;
      }

      const selectedOptionId = selectedOptions[spec.id];

      if (!selectedOptionId) {
        return true;
      }

      const selectedOption = spec.options.find(
        (option) => option.id === selectedOptionId,
      );

      return !selectedOption || selectedOption.available === false;
    });
  }, [specsWithAvailability, selectedOptions]);

  const canAddToCart =
    !isAdmin &&
    productAvailable &&
    !hasUnavailableEntireSpec &&
    missingSelections.length === 0;

  // =========================================================
  // PRECIO DE PERSONALIZACIÓN
  // =========================================================

  const customizationPrice = useMemo(() => {
    return specs.reduce((total, spec) => {
      const selectedOptionId = selectedOptions[spec.id];

      if (!selectedOptionId) {
        return total;
      }

      const selectedOption = spec.options.find(
        (option) => option.id === selectedOptionId,
      );

      // Por seguridad, una opción agotada no suma
      // al precio porque nunca debería estar seleccionada.
      if (!selectedOption || selectedOption.available === false) {
        return total;
      }

      const optionPrice =
        Number.isFinite(selectedOption.price) && selectedOption.price > 0
          ? selectedOption.price
          : 0;

      return total + optionPrice;
    }, 0);
  }, [specs, selectedOptions]);

  // =========================================================
  // PRECIO FINAL
  // =========================================================

  const finalPrice = useMemo(() => {
    if (!item) {
      return 0;
    }

    return item.price + customizationPrice;
  }, [item, customizationPrice]);

  // =========================================================
  // AGREGAR AL CARRITO
  // =========================================================

  const handleAddToCart = () => {
    if (!item) {
      return;
    }

    if (!productAvailable) {
      return;
    }

    if (hasUnavailableEntireSpec) {
      return;
    }

    if (missingSelections.length > 0) {
      return;
    }

    onAddToCart(item, selectedOptions);
  };

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
            {/* BOTÓN CERRAR */}

            <View style={styles.header}>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            {/* IMAGEN */}

            <View style={styles.imageContainer}>
              {item.photoUri ? (
                <Image
                  source={{ uri: item.photoUri }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.emoji}>{item.emoji}</Text>
              )}
            </View>

            {/* INFORMACIÓN */}

            <View style={styles.infoContainer}>
              <View style={styles.productTitleRow}>
                <Text
                  style={[
                    styles.productName,
                    !productAvailable && styles.productNameUnavailable,
                  ]}
                >
                  {item.name}
                </Text>

                {!productAvailable && (
                  <View style={styles.productUnavailableBadge}>
                    <Text style={styles.productUnavailableBadgeText}>
                      Agotado
                    </Text>
                  </View>
                )}
              </View>

              {!!item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}

              <Text style={styles.basePrice}>${item.price.toFixed(2)}</Text>
            </View>

            {/* AVISO GENERAL DE PRODUCTO AGOTADO */}

            {!productAvailable && (
              <View style={styles.unavailableProductNotice}>
                <View style={styles.noticeIndicator} />

                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle}>Producto no disponible</Text>

                  <Text style={styles.noticeText}>
                    Por el momento no podemos agregar este producto al carrito.
                  </Text>
                </View>
              </View>
            )}

            {/* PERSONALIZACIONES */}

            {specs.length > 0 && (
              <View style={styles.customizationContainer}>
                <Text style={styles.customizationTitle}>
                  Personaliza tu producto
                </Text>

                {/* AVISO DE OPCIONES */}

                {productAvailable &&
                  hasUnavailableOptions &&
                  !hasUnavailableEntireSpec && (
                    <View style={styles.optionsNotice}>
                      <View style={styles.optionsNoticeIndicator} />

                      <Text style={styles.optionsNoticeText}>
                        Algunas opciones están agotadas, pero puedes elegir
                        entre las disponibles.
                      </Text>
                    </View>
                  )}

                {specs.map((spec) => {
                  const availableOptions = spec.options.filter(
                    (option) => option && option.available !== false,
                  );

                  const allUnavailable = availableOptions.length === 0;

                  return (
                    <View key={spec.id} style={styles.specContainer}>
                      <View style={styles.specHeaderRow}>
                        <Text style={styles.specLabel}>{spec.label}</Text>

                        {allUnavailable && (
                          <View style={styles.specUnavailableBadge}>
                            <Text style={styles.specUnavailableBadgeText}>
                              Agotado
                            </Text>
                          </View>
                        )}
                      </View>

                      {allUnavailable && (
                        <Text style={styles.allOptionsUnavailableText}>
                          No hay opciones disponibles actualmente.
                        </Text>
                      )}

                      <View style={styles.optionsContainer}>
                        {spec.options.map((option) => {
                          if (!option) {
                            return null;
                          }

                          const isAvailable = option.available !== false;

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
                                !isAvailable && styles.optionButtonUnavailable,
                                isSelected &&
                                  isAvailable &&
                                  styles.optionButtonSelected,
                              ]}
                              onPress={() =>
                                handleSelectOption(spec.id, option.id)
                              }
                              disabled={!isAvailable || !productAvailable}
                            >
                              <View style={styles.optionInfo}>
                                <View style={styles.optionTextRow}>
                                  <Text
                                    style={[
                                      styles.optionText,
                                      !isAvailable &&
                                        styles.optionTextUnavailable,
                                      isSelected &&
                                        isAvailable &&
                                        styles.optionTextSelected,
                                    ]}
                                  >
                                    {option.label}
                                  </Text>

                                  {!isAvailable && (
                                    <View style={styles.unavailableOptionBadge}>
                                      <Text
                                        style={
                                          styles.unavailableOptionBadgeText
                                        }
                                      >
                                        No disponible
                                      </Text>
                                    </View>
                                  )}
                                </View>

                                {isAvailable && optionPrice > 0 && (
                                  <Text
                                    style={[
                                      styles.optionPrice,
                                      isSelected && styles.optionPriceSelected,
                                    ]}
                                  >
                                    +$
                                    {optionPrice.toFixed(2)}
                                  </Text>
                                )}

                                {!isAvailable && (
                                  <Text style={styles.unavailableOptionText}>
                                    Elige otra opción disponible
                                  </Text>
                                )}
                              </View>

                              {isSelected && isAvailable && (
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

            {/* RESUMEN DE PRECIO */}

            <View style={styles.priceSummary}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Precio base</Text>

                <Text style={styles.priceValue}>${item.price.toFixed(2)}</Text>
              </View>

              {customizationPrice > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Personalización</Text>

                  <Text style={styles.priceValue}>
                    +$
                    {customizationPrice.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>

                <Text style={styles.totalValue}>${finalPrice.toFixed(2)}</Text>
              </View>
            </View>

            {/* ADMIN */}

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

            {/* CLIENTE */}

            {!isAdmin && (
              <>
                {productAvailable && hasUnavailableEntireSpec && (
                  <View style={styles.blockedAddNotice}>
                    <Text style={styles.blockedAddNoticeTitle}>
                      No disponible actualmente
                    </Text>

                    <Text style={styles.blockedAddNoticeText}>
                      Todas las opciones de{" "}
                      {
                        specsWithAvailability.find(
                          (spec) => !spec.hasAvailableOptions,
                        )?.label
                      }{" "}
                      están agotadas.
                    </Text>
                  </View>
                )}

                {productAvailable &&
                  !hasUnavailableEntireSpec &&
                  missingSelections.length > 0 && (
                    <View style={styles.selectionNotice}>
                      <Text style={styles.selectionNoticeText}>
                        Selecciona una opción disponible para cada
                        especificación.
                      </Text>
                    </View>
                  )}

                <Pressable
                  style={[
                    styles.addButton,
                    !canAddToCart && styles.addButtonDisabled,
                  ]}
                  onPress={handleAddToCart}
                  disabled={!canAddToCart}
                >
                  <Text
                    style={[
                      styles.addButtonText,
                      !canAddToCart && styles.addButtonTextDisabled,
                    ]}
                  >
                    {!productAvailable
                      ? "Producto agotado"
                      : hasUnavailableEntireSpec
                        ? "Opciones agotadas"
                        : missingSelections.length > 0
                          ? "Selecciona tus opciones"
                          : `Agregar al carrito · $${finalPrice.toFixed(2)}`}
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  modalContainer: {
    width: "100%",
    maxWidth: WEB_MAX_WIDTH,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 35,
  },

  // =======================================================
  // HEADER
  // =======================================================

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

  // =======================================================
  // IMAGEN
  // =======================================================

  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: "#f7f3ee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  emoji: {
    fontSize: 82,
  },

  // =======================================================
  // INFORMACIÓN
  // =======================================================

  infoContainer: {
    marginBottom: 24,
  },

  productTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  productName: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },

  productNameUnavailable: {
    color: "#795548",
  },

  productUnavailableBadge: {
    backgroundColor: "#e9ddd5",
    borderWidth: 1,
    borderColor: "#d0b8ab",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },

  productUnavailableBadgeText: {
    color: "#795548",
    fontSize: 12,
    fontWeight: "700",
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

  // =======================================================
  // AVISO PRODUCTO AGOTADO
  // =======================================================

  unavailableProductNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5e9e4",
    borderWidth: 1,
    borderColor: "#dfc5ba",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },

  noticeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9a5140",
    marginRight: 10,
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#795548",
    marginBottom: 3,
  },

  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#795548",
  },

  // =======================================================
  // PERSONALIZACIONES
  // =======================================================

  customizationContainer: {
    marginBottom: 20,
  },

  customizationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 14,
  },

  optionsNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f3ee",
    borderWidth: 1,
    borderColor: "#e2d4ca",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },

  optionsNoticeIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#7a4b2a",
    marginRight: 9,
  },

  optionsNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#6b584d",
    fontWeight: "500",
  },

  specContainer: {
    marginBottom: 20,
  },

  specHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },

  specLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },

  specUnavailableBadge: {
    backgroundColor: "#f5e3dd",
    borderWidth: 1,
    borderColor: "#d39a88",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  specUnavailableBadgeText: {
    fontSize: 11,
    color: "#9a5140",
    fontWeight: "700",
  },

  allOptionsUnavailableText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#9a5140",
    marginBottom: 10,
  },

  optionsContainer: {
    gap: 10,
  },

  // =======================================================
  // OPCIONES
  // =======================================================

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

  optionButtonUnavailable: {
    backgroundColor: "#f5f3f1",
    borderColor: "#e1dcd8",
    opacity: 0.75,
  },

  optionInfo: {
    flex: 1,
  },

  optionTextRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
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

  optionTextUnavailable: {
    color: "#8a817c",
    textDecorationLine: "line-through",
  },

  unavailableOptionBadge: {
    backgroundColor: "#e9ddd5",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  unavailableOptionBadgeText: {
    color: "#795548",
    fontSize: 10,
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

  unavailableOptionText: {
    marginTop: 4,
    fontSize: 12,
    color: "#9a5140",
  },

  checkmark: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7a4b2a",
    marginLeft: 12,
  },

  // =======================================================
  // RESUMEN
  // =======================================================

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

  // =======================================================
  // ADMIN
  // =======================================================

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

  // =======================================================
  // AVISOS DEL BOTÓN
  // =======================================================

  blockedAddNotice: {
    backgroundColor: "#f5e3dd",
    borderWidth: 1,
    borderColor: "#d39a88",
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },

  blockedAddNoticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9a5140",
    marginBottom: 3,
  },

  blockedAddNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#795548",
  },

  selectionNotice: {
    backgroundColor: "#f7f3ee",
    borderWidth: 1,
    borderColor: "#e2d4ca",
    borderRadius: 12,
    padding: 11,
    marginBottom: 12,
  },

  selectionNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#6b584d",
  },

  // =======================================================
  // AGREGAR
  // =======================================================

  addButton: {
    backgroundColor: "#7a4b2a",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonDisabled: {
    backgroundColor: "#e4dfdb",
  },

  addButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  addButtonTextDisabled: {
    color: "#8a817c",
  },
});
