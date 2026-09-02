<<<<<<< HEAD
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, Animated, Image } from 'react-native';
import { MenuItem } from '../../types/menu';
import { menuColors, menuRadius, menuSpacing, menuTypography } from '../../constants/menuTheme';
=======
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
} from "../../constants/menuTheme";
import { MenuItem } from "../../types/menu";
>>>>>>> main

type Props = {
  item: MenuItem | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
};

export default function ProductDetailModal({
  item,
  visible,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, item?.id]);

  if (!item) return null;

  return (
<<<<<<< HEAD
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
=======
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
>>>>>>> main
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
<<<<<<< HEAD
                <Animated.Text style={[styles.emoji, { transform: [{ scale }] }]}>
=======
                <Animated.Text
                  style={[styles.emoji, { transform: [{ scale }] }]}
                >
>>>>>>> main
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

              {item.specs.length > 0 && (
                <View style={styles.specsBlock}>
                  <Text style={styles.sectionLabel}>ESPECIFICACIONES</Text>
                  {item.specs.map((spec, i) => (
                    <View key={i} style={styles.specRow}>
                      <Text style={styles.specLabel}>{spec.label}</Text>
                      <Text style={styles.specValue}>{spec.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
<<<<<<< HEAD
                <Pressable style={styles.editButton} onPress={() => onEdit(item)}>
                  <Text style={styles.editButtonText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={() => onDelete(item)}>
=======
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
>>>>>>> main
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </Pressable>
              </View>
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
    maxHeight: '90%',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1.6,
    borderTopLeftRadius: menuRadius.lg,
    borderTopRightRadius: menuRadius.lg,
    overflow: 'hidden',
    backgroundColor: menuColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
=======
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
>>>>>>> main
  },
  emoji: {
    fontSize: 96,
  },
  photo: {
<<<<<<< HEAD
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: menuSpacing.md,
    left: menuSpacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  priceSticker: {
    position: 'absolute',
=======
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
>>>>>>> main
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
<<<<<<< HEAD
    color: '#fff',
=======
    color: "#fff",
>>>>>>> main
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
<<<<<<< HEAD
    flexDirection: 'row',
    justifyContent: 'space-between',
=======
    flexDirection: "row",
    justifyContent: "space-between",
>>>>>>> main
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
<<<<<<< HEAD
    fontWeight: '600',
    color: menuColors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
=======
    fontWeight: "600",
    color: menuColors.textPrimary,
  },
  actions: {
    flexDirection: "row",
>>>>>>> main
    gap: menuSpacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: menuColors.accent,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
<<<<<<< HEAD
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
=======
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "700",
>>>>>>> main
  },
  deleteButton: {
    flex: 1,
    backgroundColor: menuColors.dangerSoft,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
<<<<<<< HEAD
    alignItems: 'center',
  },
  deleteButtonText: {
    color: menuColors.danger,
    fontWeight: '700',
  },
});
=======
    alignItems: "center",
  },
  deleteButtonText: {
    color: menuColors.danger,
    fontWeight: "700",
  },
});
>>>>>>> main
