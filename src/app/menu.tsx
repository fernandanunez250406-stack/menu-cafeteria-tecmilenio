<<<<<<< HEAD
import { useState } from 'react';
=======
import { useState } from "react";
>>>>>>> main
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
<<<<<<< HEAD
} from 'react-native';

import ProductCard from '../components/menu/ProductCard';
import ProductDetailModal from '../components/menu/ProductDetailModal';
import ProductFormModal from '../components/menu/ProductFormModal';
=======
} from "react-native";
import ProductCard from "../components/menu/ProductCard";
import ProductDetailModal from "../components/menu/ProductDetailModal";
import ProductFormModal from "../components/menu/ProductFormModal";
>>>>>>> main
import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
<<<<<<< HEAD
} from '../constants/menuTheme';
import { mockCategories, mockMenuItems } from '../data/mockMenu';
import { MenuItem, MenuItemDraft } from '../types/menu';
import { confirmAction } from '../utils/crossPlatformConfirm';

export default function MenuScreen() {
  const [items, setItems] = useState<MenuItem[]>(mockMenuItems);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

=======
} from "../constants/menuTheme";
import { mockCategories, mockMenuItems } from "../data/mockMenu";
import { MenuItem, MenuItemDraft } from "../types/menu";
import { confirmAction } from "../utils/crossPlatformConfirm";

export default function MenuScreen() {
  const [items, setItems] = useState<MenuItem[]>(mockMenuItems);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
>>>>>>> main
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory =
<<<<<<< HEAD
      selectedCategory === 'Todos' ||
      item.categoryId === selectedCategory;

=======
      selectedCategory === "Todos" || item.categoryId === selectedCategory;
>>>>>>> main
    return matchesSearch && matchesCategory;
  });

  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormVisible(true);
  };

  const openDetail = (item: MenuItem) => {
    setDetailItem(item);
    setDetailVisible(true);
  };

  const toggleAvailability = (item: MenuItem) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, available: !it.available } : it,
      ),
    );
  };

  const openEditForm = (item: MenuItem) => {
    setDetailVisible(false);
    setEditingItem(item);
    setFormVisible(true);
  };

  const handleSave = (draft: MenuItemDraft, id?: string) => {
    if (id) {
      setItems((prev) =>
<<<<<<< HEAD
        prev.map((it) =>
          it.id === id ? { ...it, ...draft } : it
        )
=======
        prev.map((it) => (it.id === id ? { ...it, ...draft } : it)),
>>>>>>> main
      );
    } else {
      const newItem: MenuItem = {
        ...draft,
        id: `item-${Date.now()}`,
        available: true, // nuevo producto inicia disponible
      };

      setItems((prev) => [newItem, ...prev]);
    }

    setFormVisible(false);
  };

  const handleDelete = (item: MenuItem) => {
    confirmAction(
      "Eliminar producto",
      `¿Quitar "${item.name}" del menú?`,
      () => {
        setItems((prev) =>
          prev.filter((it) => it.id !== item.id)
        );
        setDetailVisible(false);
      },
      "Eliminar",
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Menú</Text>
          <Text style={styles.headerSubtitle}>{items.length} productos</Text>
        </View>

<<<<<<< HEAD
        <Pressable
          style={styles.addButton}
          onPress={openCreateForm}
        >
=======
        <Pressable style={styles.addButton} onPress={openCreateForm}>
>>>>>>> main
          <Text style={styles.addButtonText}>+ Agregar</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar productos.."
        value={searchText}
        onChangeText={setSearchText}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <Pressable
          style={styles.categoryButton}
          onPress={() => setSelectedCategory("Todos")}
        >
          <Text style={styles.categoryText}>Todos</Text>
        </Pressable>

        {mockCategories.map((category) => (
          <Pressable
            key={category.id}
            style={styles.categoryButton}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryText}>
              {category.emoji} {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => openDetail(item)}
<<<<<<< HEAD
            onToggleAvailability={() =>
              toggleAvailability(item)
            }
=======
            onToggleAvailability={() => toggleAvailability(item)}
>>>>>>> main
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              No hay productos aquí todavía
            </Text>
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
<<<<<<< HEAD
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
=======
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
>>>>>>> main
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
    alignItems: "center",
  },
  emptyTitle: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
    marginBottom: menuSpacing.xs,
  },
  emptyBody: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    textAlign: "center",
  },
  searchInput: {
    marginHorizontal: menuSpacing.lg,
    marginTop: menuSpacing.md,
    marginBottom: menuSpacing.md,
    paddingHorizontal: menuSpacing.md,
    paddingVertical: menuSpacing.sm,
    borderWidth: 1,
    borderColor: menuColors.textSecondary,
    borderRadius: menuRadius.md,
    backgroundColor: menuColors.background,
    color: menuColors.textPrimary,
  },
  categoriesContainer: {
    flexGrow: 0,
    paddingHorizontal: menuSpacing.lg,
    marginBottom: menuSpacing.lg,
  },
  categoriesContent: {
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: menuSpacing.md,
    height: 42,
<<<<<<< HEAD
    justifyContent: 'center',
    borderRadius: menuRadius.md,
    backgroundColor: '#E5E5E5',
=======
    justifyContent: "center",
    borderRadius: menuRadius.md,
    backgroundColor: "#E5E5E5",
>>>>>>> main
    marginRight: 16,
  },
  categoryText: {
    ...menuTypography.body,
    color: menuColors.textPrimary,
  },
  addButton: {
    backgroundColor: menuColors.textPrimary,
    paddingHorizontal: menuSpacing.md,
    height: 42,
    borderRadius: menuRadius.md,
<<<<<<< HEAD
    justifyContent: 'center',
    alignItems: 'center',
=======
    justifyContent: "center",
    alignItems: "center",
>>>>>>> main
  },
  addButtonText: {
    ...menuTypography.body,
    color: menuColors.background,
<<<<<<< HEAD
    fontWeight: 'bold',
  },
});
=======
    fontWeight: "bold",
  },
});
>>>>>>> main
