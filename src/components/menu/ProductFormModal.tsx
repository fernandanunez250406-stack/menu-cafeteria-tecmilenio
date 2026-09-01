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

type Props = {
  visible: boolean;
  categories: MenuCategory[];
  initialItem: MenuItem | null; // null = alta nueva, con datos = edición
  onClose: () => void;
  onSave: (draft: MenuItemDraft, id?: string) => void;
};

const emptyDraft = (categoryId: string): MenuItemDraft => ({
  categoryId,
  name: '',
  price: 0,
  emoji: '🍽️',
  photoUri: null,
  description: '',
  specs: [],
});

export default function ProductFormModal({
  visible,
  categories,
  initialItem,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<MenuItemDraft>(
    initialItem ?? emptyDraft(categories[0]?.id ?? '')
  );
  const [priceText, setPriceText] = useState(initialItem ? String(initialItem.price) : '');

  useEffect(() => {
    if (visible) {
      setDraft(initialItem ?? emptyDraft(categories[0]?.id ?? ''));
      setPriceText(initialItem ? String(initialItem.price) : '');
    }
  }, [visible, initialItem]);

  const pickImage = async () => {
    // En web el picker del navegador no requiere este permiso, pero en
    // Android/iOS sí hay que pedirlo antes de abrir la galería.
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Activa el acceso a tus fotos para poder subir una imagen del producto.'
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
    if (!draft.name.trim()) return; // validación mínima
    const parsedPrice = parseFloat(priceText.replace(',', '.')) || 0;
    onSave({ ...draft, price: parsedPrice }, initialItem?.id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialItem ? 'Editar producto' : 'Nuevo producto'}
            </Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Cancelar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Pressable onPress={pickImage} style={styles.imagePicker}>
              {draft.photoUri ? (
                <Image source={{ uri: draft.photoUri }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderEmoji}>{draft.emoji || '🍽️'}</Text>
                </View>
              )}
              <View style={styles.imagePickerLabel}>
                <Text style={styles.imagePickerLabelText}>
                  {draft.photoUri ? 'Cambiar imagen' : 'Agregar imagen desde tu dispositivo'}
                </Text>
              </View>
            </Pressable>

            {draft.photoUri && (
              <Pressable onPress={removeImage} style={styles.removeImageButton}>
                <Text style={styles.removeImageText}>Quitar foto y usar emoji</Text>
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
                      onPress={() => setDraft((d) => ({ ...d, categoryId: cat.id }))}
                      style={[styles.categoryOption, active && styles.categoryOptionActive]}
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
                onChangeText={(text) => setDraft((d) => ({ ...d, description: text }))}
                placeholder="Describe el producto para tus clientes"
                placeholderTextColor={menuColors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </Field>

            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {initialItem ? 'Guardar cambios' : 'Agregar al menú'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: menuColors.background,
    borderTopLeftRadius: menuRadius.lg,
    borderTopRightRadius: menuRadius.lg,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  form: {
    padding: menuSpacing.lg,
  },
  imagePicker: {
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
    backgroundColor: menuColors.accentSoft,
  },
  imagePlaceholderEmoji: {
    fontSize: 56,
  },
  removeImageButton: {
    alignSelf: 'flex-start',
    marginTop: -menuSpacing.md,
    marginBottom: menuSpacing.lg,
  },
  removeImageText: {
    ...menuTypography.body,
    fontSize: 13,
    color: menuColors.danger,
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
    textAlignVertical: 'top',
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
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: menuColors.accent,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
    alignItems: 'center',
    marginTop: menuSpacing.sm,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});