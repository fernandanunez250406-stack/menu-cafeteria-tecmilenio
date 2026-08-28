import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { MenuItem, MenuItemDraft } from '../types/menu';
import { mockCategories, mockMenuItems } from '../data/mockMenu';
import ProductCard from '../components/menu/ProductCard';
import ProductDetailModal from '../components/menu/ProductDetailModal';
import ProductFormModal from '../components/menu/ProductFormModal';
import { menuColors, menuRadius, menuSpacing, menuTypography } from '../constants/menuTheme';
import { confirmAction } from '../utils/crossPlatformConfirm';

export default function MenuScreen() {
  const [items, setItems] = useState<MenuItem[]>(mockMenuItems);

  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const openDetail = (item: MenuItem) => {
    setDetailItem(item);
    setDetailVisible(true);
  };

  const openEditForm = (item: MenuItem) => {
    setDetailVisible(false);
    setEditingItem(item);
    setFormVisible(true);
  };

  const handleSave = (draft: MenuItemDraft, id?: string) => {
    if (id) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...draft } : it)));
    } else {
      const newItem: MenuItem = { ...draft, id: `item-${Date.now()}` };
      setItems((prev) => [newItem, ...prev]);
    }
    setFormVisible(false);
  };

  const handleDelete = (item: MenuItem) => {
    confirmAction(
      'Eliminar producto',
      `¿Quitar "${item.name}" del menú?`,
      () => {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        setDetailVisible(false);
      },
      'Eliminar'
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Menú</Text>
        <Text style={styles.headerSubtitle}>{items.length} productos</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => <ProductCard item={item} onPress={() => openDetail(item)} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hay productos aquí todavía</Text>
          </View>
        }
      />

      <ProductDetailModal
        item={detailItem}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />

      <ProductFormModal
        visible={formVisible}
        categories={mockCategories}
        initialItem={editingItem}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: menuColors.background,
  },
  headerRow: {
    paddingHorizontal: menuSpacing.lg,
    paddingTop: menuSpacing.md,
  },
  headerTitle: {
    ...menuTypography.title,
    fontSize: 26,
    color: menuColors.textPrimary,
  },
  headerSubtitle: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    marginTop: 2,
  },
  grid: {
    paddingHorizontal: menuSpacing.sm,
    paddingBottom: menuSpacing.xxl,
  },
  emptyState: {
    padding: menuSpacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
    marginBottom: menuSpacing.xs,
  },
  emptyBody: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    textAlign: 'center',
  },
});