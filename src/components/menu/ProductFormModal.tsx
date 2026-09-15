import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
} from "../../constants/menuTheme";

import {
  MenuCategory,
  MenuItem,
  MenuItemDraft,
  MenuSpec,
  MenuSpecOption,
} from "../../types/menu";

import { uploadImage } from "../../services/api";

type Props = {
  visible: boolean;
  categories: MenuCategory[];
  initialItem: MenuItem | null;
  onClose: () => void;
  onSave: (draft: MenuItemDraft, id?: string) => void | Promise<void>;
};

const emptyDraft = (categoryId: string): MenuItemDraft => ({
  categoryId,
  name: "",
  price: 0,
  emoji: "🍽️",
  photoUri: null,
  description: "",
  specs: [],
  available: true,
});

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyOption = (): MenuSpecOption => ({
  id: createId("option"),
  label: "",
  price: 0,
  isDefault: true,
});

export default function ProductFormModal({
  visible,
  categories,
  initialItem,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<MenuItemDraft>(
    initialItem ?? emptyDraft(categories[0]?.id ?? ""),
  );

  const [priceText, setPriceText] = useState(
    initialItem ? String(initialItem.price) : "",
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(initialItem ?? emptyDraft(categories[0]?.id ?? ""));

      setPriceText(initialItem ? String(initialItem.price) : "");

      setIsSaving(false);
    }
  }, [visible, initialItem, categories]);

  // =========================================================
  // IMAGEN
  // =========================================================

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso necesario",
          "Activa el acceso a tus fotos para poder subir una imagen del producto.",
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setDraft((d) => ({
          ...d,
          photoUri: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);

      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  const removeImage = () => {
    setDraft((d) => ({
      ...d,
      photoUri: null,
    }));
  };

  // =========================================================
  // ESPECIFICACIONES
  // =========================================================

  const addSpec = () => {
    setDraft((d) => ({
      ...d,
      specs: [
        ...d.specs,
        {
          id: createId("spec"),
          label: "",
          options: [createEmptyOption()],
        },
      ],
    }));
  };

  const updateSpecLabel = (index: number, text: string) => {
    setDraft((d) => {
      const updatedSpecs = [...d.specs];

      updatedSpecs[index] = {
        ...updatedSpecs[index],
        label: text,
      };

      return {
        ...d,
        specs: updatedSpecs,
      };
    });
  };

  const removeSpec = (index: number) => {
    setDraft((d) => ({
      ...d,
      specs: d.specs.filter((_, i) => i !== index),
    }));
  };

  const addOption = (specIndex: number) => {
    setDraft((d) => {
      const updatedSpecs = [...d.specs];

      const spec = updatedSpecs[specIndex];

      const newOption: MenuSpecOption = {
        id: createId("option"),
        label: "",
        price: 0,
        isDefault: spec.options.length === 0,
      };

      updatedSpecs[specIndex] = {
        ...spec,
        options: [...spec.options, newOption],
      };

      return {
        ...d,
        specs: updatedSpecs,
      };
    });
  };

  const updateOption = (
    specIndex: number,
    optionIndex: number,
    field: "label" | "price",
    value: string,
  ) => {
    setDraft((d) => {
      const updatedSpecs = [...d.specs];

      const updatedOptions = [...updatedSpecs[specIndex].options];

      if (field === "label") {
        updatedOptions[optionIndex] = {
          ...updatedOptions[optionIndex],
          label: value,
        };
      } else {
        const parsedPrice = parseFloat(value.replace(",", ".")) || 0;

        updatedOptions[optionIndex] = {
          ...updatedOptions[optionIndex],
          price: parsedPrice,
        };
      }

      updatedSpecs[specIndex] = {
        ...updatedSpecs[specIndex],
        options: updatedOptions,
      };

      return {
        ...d,
        specs: updatedSpecs,
      };
    });
  };

  const setDefaultOption = (specIndex: number, optionIndex: number) => {
    setDraft((d) => {
      const updatedSpecs = [...d.specs];

      updatedSpecs[specIndex] = {
        ...updatedSpecs[specIndex],
        options: updatedSpecs[specIndex].options.map((option, index) => ({
          ...option,
          isDefault: index === optionIndex,
        })),
      };

      return {
        ...d,
        specs: updatedSpecs,
      };
    });
  };

  const removeOption = (specIndex: number, optionIndex: number) => {
    setDraft((d) => {
      const updatedSpecs = [...d.specs];

      const currentOptions = updatedSpecs[specIndex].options;

      // Siempre debe quedar al menos
      // una opción.
      if (currentOptions.length === 1) {
        return d;
      }

      const removedOption = currentOptions[optionIndex];

      let updatedOptions = currentOptions.filter(
        (_, index) => index !== optionIndex,
      );

      // Si eliminamos la opción
      // predeterminada, la primera
      // restante será la predeterminada.
      if (removedOption.isDefault) {
        updatedOptions = updatedOptions.map((option, index) => ({
          ...option,
          isDefault: index === 0,
        }));
      }

      updatedSpecs[specIndex] = {
        ...updatedSpecs[specIndex],
        options: updatedOptions,
      };

      return {
        ...d,
        specs: updatedSpecs,
      };
    });
  };

  // =========================================================
  // GUARDAR PRODUCTO
  // =========================================================

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    if (!draft.name.trim()) {
      Alert.alert("Falta información", "Escribe el nombre del producto.");
      return;
    }

    const parsedPrice = parseFloat(priceText.replace(",", ".")) || 0;

    if (parsedPrice < 0) {
      Alert.alert("Precio inválido", "El precio no puede ser negativo.");
      return;
    }

    if (!draft.categoryId) {
      Alert.alert("Falta información", "Selecciona una categoría.");
      return;
    }

    const cleanSpecs = draft.specs
      .map((spec): MenuSpec | null => {
        const validOptions: MenuSpecOption[] = spec.options
          .filter((option) => option.label.trim())
          .map((option) => ({
            ...option,
            label: option.label.trim(),
            price:
              Number.isFinite(option.price) && option.price >= 0
                ? option.price
                : 0,
            isDefault: Boolean(option.isDefault),
          }));

        if (!spec.label.trim() || validOptions.length === 0) {
          return null;
        }

        const hasDefault = validOptions.some((option) => option.isDefault);

        const normalizedOptions: MenuSpecOption[] = validOptions.map(
          (option, index) => ({
            ...option,
            isDefault: hasDefault ? Boolean(option.isDefault) : index === 0,
          }),
        );

        return {
          id: spec.id,
          label: spec.label.trim(),
          options: normalizedOptions,
        };
      })
      .filter((spec): spec is MenuSpec => spec !== null);

    try {
      setIsSaving(true);

      let finalPhotoUri = draft.photoUri;

      // =====================================================
      // SUBIR IMAGEN A CLOUDINARY
      // =====================================================

      /*
       * Si photoUri NO empieza con http://
       * o https://, significa que es una
       * imagen local recién seleccionada.
       *
       * En ese caso la subimos a Cloudinary.
       *
       * Si ya es una URL, significa que la
       * imagen ya está almacenada en Cloudinary
       * y no necesitamos volver a subirla.
       */
      if (
        finalPhotoUri &&
        !finalPhotoUri.startsWith("http://") &&
        !finalPhotoUri.startsWith("https://")
      ) {
        const uploadResult = await uploadImage(finalPhotoUri);

        if (!uploadResult?.url) {
          throw new Error("Cloudinary no devolvió una URL de imagen.");
        }

        finalPhotoUri = uploadResult.url;
      }

      // =====================================================
      // PREPARAR PRODUCTO
      // =====================================================

      const finalDraft: MenuItemDraft = {
        ...draft,
        name: draft.name.trim(),
        price: parsedPrice,
        photoUri: finalPhotoUri,
        specs: cleanSpecs,
      };

      // =====================================================
      // GUARDAR EN FIREBASE
      // =====================================================

      await onSave(finalDraft, initialItem?.id);

      setIsSaving(false);
    } catch (error) {
      console.error("Error al guardar producto:", error);

      setIsSaving(false);

      Alert.alert(
        "Error",
        "No se pudo guardar el producto. Verifica tu conexión e inténtalo nuevamente.",
      );
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* HEADER */}

          <View style={styles.header}>
            <Text style={styles.title}>
              {initialItem ? "Editar producto" : "Nuevo producto"}
            </Text>

            <Pressable onPress={onClose} disabled={isSaving}>
              <Text style={styles.closeText}>Cancelar</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
          >
            {/* IMAGEN */}

            <Pressable
              onPress={pickImage}
              disabled={isSaving}
              style={styles.imagePicker}
            >
              {draft.photoUri ? (
                <Image
                  source={{
                    uri: draft.photoUri,
                  }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderEmoji}>
                    {draft.emoji || "🍽️"}
                  </Text>
                </View>
              )}

              <View style={styles.imagePickerLabel}>
                <Text style={styles.imagePickerLabelText}>
                  {draft.photoUri
                    ? "Cambiar imagen"
                    : "Agregar imagen desde tu dispositivo"}
                </Text>
              </View>
            </Pressable>

            {draft.photoUri && (
              <Pressable
                onPress={removeImage}
                disabled={isSaving}
                style={styles.removeImageButton}
              >
                <Text style={styles.removeImageText}>
                  Quitar foto y usar emoji
                </Text>
              </Pressable>
            )}

            {/* NOMBRE */}

            <Field label="Nombre del producto">
              <TextInput
                style={styles.input}
                value={draft.name}
                onChangeText={(text) =>
                  setDraft((d) => ({
                    ...d,
                    name: text,
                  }))
                }
                placeholder="Ej. Latte Vainilla"
                placeholderTextColor={menuColors.textSecondary}
                editable={!isSaving}
              />
            </Field>

            {/* PRECIO */}

            <Field label="Precio (MXN)">
              <TextInput
                style={styles.input}
                value={priceText}
                onChangeText={setPriceText}
                placeholder="Ej. 45"
                placeholderTextColor={menuColors.textSecondary}
                keyboardType="decimal-pad"
                editable={!isSaving}
              />
            </Field>

            {/* CATEGORÍA */}

            <Field label="Categoría (bucket)">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => {
                  const active = draft.categoryId === cat.id;

                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          categoryId: cat.id,
                        }))
                      }
                      disabled={isSaving}
                      style={[
                        styles.categoryOption,
                        active && styles.categoryOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          active && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat.emoji} {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Field>

            {/* DESCRIPCIÓN */}

            <Field label="Descripción">
              <TextInput
                style={[styles.input, styles.textArea]}
                value={draft.description}
                onChangeText={(text) =>
                  setDraft((d) => ({
                    ...d,
                    description: text,
                  }))
                }
                placeholder="Describe el producto para tus clientes"
                placeholderTextColor={menuColors.textSecondary}
                multiline
                numberOfLines={3}
                editable={!isSaving}
              />
            </Field>

            {/* ESPECIFICACIONES */}

            <Field label="Especificaciones">
              <View style={styles.specsContainer}>
                {draft.specs.map((spec, specIndex) => (
                  <View key={spec.id} style={styles.specCard}>
                    {/* NOMBRE DE LA ESPECIFICACIÓN */}

                    <View style={styles.specHeader}>
                      <TextInput
                        style={[styles.input, styles.specLabelInput]}
                        value={spec.label}
                        onChangeText={(text) =>
                          updateSpecLabel(specIndex, text)
                        }
                        placeholder="Ej. Tipo de leche"
                        placeholderTextColor={menuColors.textSecondary}
                        editable={!isSaving}
                      />

                      <Pressable
                        onPress={() => removeSpec(specIndex)}
                        disabled={isSaving}
                        style={styles.removeSpecButton}
                      >
                        <Text style={styles.removeSpecText}>🗑️</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.optionsTitle}>Opciones</Text>

                    {/* OPCIONES */}

                    <View style={styles.optionsContainer}>
                      {spec.options.map((option, optionIndex) => (
                        <View key={option.id} style={styles.optionRow}>
                          <TextInput
                            style={[styles.input, styles.optionLabelInput]}
                            value={option.label}
                            onChangeText={(text) =>
                              updateOption(
                                specIndex,
                                optionIndex,
                                "label",
                                text,
                              )
                            }
                            placeholder="Ej. Leche entera"
                            placeholderTextColor={menuColors.textSecondary}
                            editable={!isSaving}
                          />

                          <TextInput
                            style={[styles.input, styles.optionPriceInput]}
                            value={String(option.price)}
                            onChangeText={(text) =>
                              updateOption(
                                specIndex,
                                optionIndex,
                                "price",
                                text,
                              )
                            }
                            placeholder="$0"
                            placeholderTextColor={menuColors.textSecondary}
                            keyboardType="decimal-pad"
                            editable={!isSaving}
                          />

                          {/* DEFAULT */}

                          <Pressable
                            onPress={() =>
                              setDefaultOption(specIndex, optionIndex)
                            }
                            disabled={isSaving}
                            style={[
                              styles.defaultButton,
                              option.isDefault && styles.defaultButtonActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.defaultButtonText,
                                option.isDefault &&
                                  styles.defaultButtonTextActive,
                              ]}
                            >
                              {option.isDefault ? "✓" : "○"}
                            </Text>
                          </Pressable>

                          {/* ELIMINAR OPCIÓN */}

                          <Pressable
                            onPress={() => removeOption(specIndex, optionIndex)}
                            disabled={isSaving || spec.options.length === 1}
                            style={[
                              styles.removeOptionButton,
                              spec.options.length === 1 &&
                                styles.removeOptionButtonDisabled,
                            ]}
                          >
                            <Text style={styles.removeSpecText}>🗑️</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.defaultHint}>
                      Marca una opción como predeterminada.
                    </Text>

                    <Pressable
                      style={styles.addOptionButton}
                      onPress={() => addOption(specIndex)}
                      disabled={isSaving}
                    >
                      <Text style={styles.addOptionText}>+ Agregar opción</Text>
                    </Pressable>
                  </View>
                ))}

                {/* AGREGAR ESPECIFICACIÓN */}

                <Pressable
                  style={styles.addSpecButton}
                  onPress={addSpec}
                  disabled={isSaving}
                >
                  <Text style={styles.addSpecText}>
                    + Agregar especificación
                  </Text>
                </Pressable>
              </View>
            </Field>

            {/* GUARDAR */}

            <Pressable
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving
                  ? "Subiendo imagen..."
                  : initialItem
                    ? "Guardar cambios"
                    : "Agregar al menú"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =========================================================
// FIELD
// =========================================================

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      {children}
    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

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
    maxHeight: "92%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: menuSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: menuColors.border,
  },

  title: {
    ...menuTypography.title,
    fontSize: 18,
    color: menuColors.textPrimary,
  },

  closeText: {
    color: menuColors.textSecondary,
    fontWeight: "600",
  },

  form: {
    padding: menuSpacing.lg,
  },

  // =======================================================
  // IMAGEN
  // =======================================================

  imagePicker: {
    width: "100%",
    aspectRatio: 1.4,
    borderRadius: menuRadius.md,
    overflow: "hidden",
    marginBottom: menuSpacing.lg,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: menuColors.accentSoft,
  },

  imagePlaceholderEmoji: {
    fontSize: 56,
  },

  removeImageButton: {
    alignSelf: "flex-start",
    marginTop: -menuSpacing.md,
    marginBottom: menuSpacing.lg,
  },

  removeImageText: {
    ...menuTypography.body,
    fontSize: 13,
    color: menuColors.danger,
    fontWeight: "600",
  },

  imagePickerLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: menuSpacing.sm,
    alignItems: "center",
  },

  imagePickerLabelText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  // =======================================================
  // CAMPOS
  // =======================================================

  field: {
    marginBottom: menuSpacing.lg,
  },

  fieldLabel: {
    ...menuTypography.label,
    color: menuColors.textSecondary,
    marginBottom: menuSpacing.sm,
  },

  input: {
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.md,
    paddingHorizontal: menuSpacing.md,
    paddingVertical: menuSpacing.md,
    fontSize: 15,
    color: menuColors.textPrimary,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // =======================================================
  // CATEGORÍAS
  // =======================================================

  categoryOption: {
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.pill,
    paddingHorizontal: menuSpacing.md,
    paddingVertical: menuSpacing.sm,
    marginRight: menuSpacing.sm,
  },

  categoryOptionActive: {
    backgroundColor: menuColors.accent,
    borderColor: menuColors.accent,
  },

  categoryOptionText: {
    ...menuTypography.body,
    color: menuColors.textPrimary,
  },

  categoryOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // =======================================================
  // GUARDAR
  // =======================================================

  saveButton: {
    backgroundColor: menuColors.accent,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
    alignItems: "center",
    marginTop: menuSpacing.sm,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // =======================================================
  // ESPECIFICACIONES
  // =======================================================

  specsContainer: {
    gap: menuSpacing.md,
  },

  specCard: {
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.md,
    padding: menuSpacing.md,
    gap: menuSpacing.sm,
  },

  specHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: menuSpacing.sm,
  },

  specLabelInput: {
    flex: 1,
  },

  optionsTitle: {
    ...menuTypography.label,
    color: menuColors.textSecondary,
    marginTop: menuSpacing.sm,
  },

  optionsContainer: {
    gap: menuSpacing.sm,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: menuSpacing.xs,
  },

  optionLabelInput: {
    flex: 1,
  },

  optionPriceInput: {
    width: 70,
  },

  defaultButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.md,
    backgroundColor: menuColors.background,
  },

  defaultButtonActive: {
    backgroundColor: menuColors.accentSoft,
    borderColor: menuColors.accent,
  },

  defaultButtonText: {
    fontSize: 20,
    color: menuColors.textSecondary,
  },

  defaultButtonTextActive: {
    color: menuColors.accent,
    fontWeight: "700",
  },

  defaultHint: {
    fontSize: 12,
    color: menuColors.textSecondary,
  },

  removeOptionButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: menuColors.dangerSoft,
    borderRadius: menuRadius.md,
  },

  removeOptionButtonDisabled: {
    opacity: 0.4,
  },

  removeSpecButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: menuColors.dangerSoft,
    borderRadius: menuRadius.md,
  },

  removeSpecText: {
    fontSize: 18,
  },

  addOptionButton: {
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.sm,
    alignItems: "center",
  },

  addOptionText: {
    color: menuColors.accent,
    fontWeight: "600",
  },

  addSpecButton: {
    borderWidth: 1,
    borderColor: menuColors.accent,
    borderRadius: menuRadius.md,
    borderStyle: "dashed",
    paddingVertical: menuSpacing.md,
    alignItems: "center",
  },

  addSpecText: {
    color: menuColors.accent,
    fontWeight: "700",
  },
});
