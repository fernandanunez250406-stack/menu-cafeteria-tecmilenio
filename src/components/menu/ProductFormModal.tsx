<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MenuCategory, MenuItem, MenuItemDraft } from '../../types/menu';
import { menuColors, menuRadius, menuSpacing, menuTypography } from '../../constants/menuTheme';
=======
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
import { MenuCategory, MenuItem, MenuItemDraft } from "../../types/menu";
>>>>>>> main

type Props = {
  visible: boolean;
  categories: MenuCategory[];
  initialItem: MenuItem | null; // null = alta nueva, con datos = edición
  onClose: () => void;
  onSave: (draft: MenuItemDraft, id?: string) => void;
};

const emptyDraft = (categoryId: string): MenuItemDraft => ({
  categoryId,
<<<<<<< HEAD
  name: '',
  price: 0,
  emoji: '🍽️',
  photoUri: null,
  description: '',
  specs: [],
=======
  name: "",
  price: 0,
  emoji: "🍽️",
  photoUri: null,
  description: "",
  specs: [],
  available: true,
>>>>>>> main
});

export default function ProductFormModal({
  visible,
  categories,
  initialItem,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<MenuItemDraft>(
<<<<<<< HEAD
    initialItem ?? emptyDraft(categories[0]?.id ?? '')
  );
  const [priceText, setPriceText] = useState(initialItem ? String(initialItem.price) : '');

  useEffect(() => {
    if (visible) {
      setDraft(initialItem ?? emptyDraft(categories[0]?.id ?? ''));
      setPriceText(initialItem ? String(initialItem.price) : '');
=======
    initialItem ?? emptyDraft(categories[0]?.id ?? ""),
  );
  const [priceText, setPriceText] = useState(
    initialItem ? String(initialItem.price) : "",
  );

  useEffect(() => {
    if (visible) {
      setDraft(initialItem ?? emptyDraft(categories[0]?.id ?? ""));
      setPriceText(initialItem ? String(initialItem.price) : "");
>>>>>>> main
    }
  }, [visible, initialItem]);

  const pickImage = async () => {
<<<<<<< HEAD
    // En web el picker del navegador no requiere este permiso, pero en
    // Android/iOS sí hay que pedirlo antes de abrir la galería.
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Activa el acceso a tus fotos para poder subir una imagen del producto.'
=======
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso necesario",
          "Activa el acceso a tus fotos para poder subir una imagen del producto.",
>>>>>>> main
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setDraft((d) => ({ ...d, photoUri: result.assets[0].uri }));
    }
  };

  const removeImage = () => {
    setDraft((d) => ({ ...d, photoUri: null }));
  };

  const handleSave = () => {
<<<<<<< HEAD
    if (!draft.name.trim()) return; // validación mínima
    const parsedPrice = parseFloat(priceText.replace(',', '.')) || 0;
=======
    if (!draft.name.trim()) return;
    const parsedPrice = parseFloat(priceText.replace(",", ".")) || 0;
>>>>>>> main
    onSave({ ...draft, price: parsedPrice }, initialItem?.id);
  };

  return (
<<<<<<< HEAD
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
=======
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
>>>>>>> main
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
<<<<<<< HEAD
              {initialItem ? 'Editar producto' : 'Nuevo producto'}
=======
              {initialItem ? "Editar producto" : "Nuevo producto"}
>>>>>>> main
            </Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Cancelar</Text>
            </Pressable>
          </View>

<<<<<<< HEAD
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
=======
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
          >
>>>>>>> main
            <Pressable onPress={pickImage} style={styles.imagePicker}>
              {draft.photoUri ? (
                <Image source={{ uri: draft.photoUri }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
<<<<<<< HEAD
                  <Text style={styles.imagePlaceholderEmoji}>{draft.emoji || '🍽️'}</Text>
=======
                  <Text style={styles.imagePlaceholderEmoji}>
                    {draft.emoji || "🍽️"}
                  </Text>
>>>>>>> main
                </View>
              )}
              <View style={styles.imagePickerLabel}>
                <Text style={styles.imagePickerLabelText}>
<<<<<<< HEAD
                  {draft.photoUri ? 'Cambiar imagen' : 'Agregar imagen desde tu dispositivo'}
=======
                  {draft.photoUri
                    ? "Cambiar imagen"
                    : "Agregar imagen desde tu dispositivo"}
>>>>>>> main
                </Text>
              </View>
            </Pressable>

            {draft.photoUri && (
              <Pressable onPress={removeImage} style={styles.removeImageButton}>
<<<<<<< HEAD
                <Text style={styles.removeImageText}>Quitar foto y usar emoji</Text>
=======
                <Text style={styles.removeImageText}>
                  Quitar foto y usar emoji
                </Text>
>>>>>>> main
              </Pressable>
            )}

            <Field label="Nombre del producto">
              <TextInput
                style={styles.input}
                value={draft.name}
                onChangeText={(text) => setDraft((d) => ({ ...d, name: text }))}
                placeholder="Ej. Latte Vainilla"
                placeholderTextColor={menuColors.textSecondary}
              />
            </Field>

            <Field label="Precio (MXN)">
              <TextInput
                style={styles.input}
                value={priceText}
                onChangeText={setPriceText}
                placeholder="Ej. 45"
                placeholderTextColor={menuColors.textSecondary}
                keyboardType="decimal-pad"
              />
            </Field>

            <Field label="Categoría (bucket)">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => {
                  const active = draft.categoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
<<<<<<< HEAD
                      onPress={() => setDraft((d) => ({ ...d, categoryId: cat.id }))}
                      style={[styles.categoryOption, active && styles.categoryOptionActive]}
=======
                      onPress={() =>
                        setDraft((d) => ({ ...d, categoryId: cat.id }))
                      }
                      style={[
                        styles.categoryOption,
                        active && styles.categoryOptionActive,
                      ]}
>>>>>>> main
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

            <Field label="Descripción">
              <TextInput
                style={[styles.input, styles.textArea]}
                value={draft.description}
<<<<<<< HEAD
                onChangeText={(text) => setDraft((d) => ({ ...d, description: text }))}
=======
                onChangeText={(text) =>
                  setDraft((d) => ({ ...d, description: text }))
                }
>>>>>>> main
                placeholder="Describe el producto para tus clientes"
                placeholderTextColor={menuColors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </Field>

            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
<<<<<<< HEAD
                {initialItem ? 'Guardar cambios' : 'Agregar al menú'}
=======
                {initialItem ? "Guardar cambios" : "Agregar al menú"}
>>>>>>> main
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

<<<<<<< HEAD
function Field({ label, children }: { label: string; children: React.ReactNode }) {
=======
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
>>>>>>> main
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: menuColors.overlay,
<<<<<<< HEAD
    justifyContent: 'flex-end',
=======
    justifyContent: "flex-end",
>>>>>>> main
  },
  sheet: {
    backgroundColor: menuColors.background,
    borderTopLeftRadius: menuRadius.lg,
    borderTopRightRadius: menuRadius.lg,
<<<<<<< HEAD
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
=======
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
>>>>>>> main
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
<<<<<<< HEAD
    fontWeight: '600',
=======
    fontWeight: "600",
>>>>>>> main
  },
  form: {
    padding: menuSpacing.lg,
  },
  imagePicker: {
<<<<<<< HEAD
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: menuRadius.md,
    overflow: 'hidden',
    marginBottom: menuSpacing.lg,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
=======
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
>>>>>>> main
    backgroundColor: menuColors.accentSoft,
  },
  imagePlaceholderEmoji: {
    fontSize: 56,
  },
  removeImageButton: {
<<<<<<< HEAD
    alignSelf: 'flex-start',
=======
    alignSelf: "flex-start",
>>>>>>> main
    marginTop: -menuSpacing.md,
    marginBottom: menuSpacing.lg,
  },
  removeImageText: {
    ...menuTypography.body,
    fontSize: 13,
    color: menuColors.danger,
<<<<<<< HEAD
    fontWeight: '600',
  },
  imagePickerLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: menuSpacing.sm,
    alignItems: 'center',
  },
  imagePickerLabelText: {
    color: '#fff',
    fontWeight: '600',
=======
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
>>>>>>> main
    fontSize: 13,
  },
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
<<<<<<< HEAD
    textAlignVertical: 'top',
=======
    textAlignVertical: "top",
>>>>>>> main
  },
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
<<<<<<< HEAD
    color: '#fff',
    fontWeight: '600',
=======
    color: "#fff",
    fontWeight: "600",
>>>>>>> main
  },
  saveButton: {
    backgroundColor: menuColors.accent,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
<<<<<<< HEAD
    alignItems: 'center',
    marginTop: menuSpacing.sm,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
=======
    alignItems: "center",
    marginTop: menuSpacing.sm,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
>>>>>>> main
