import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../components/menu/ProductCard";
import ProductDetailModal from "../components/menu/ProductDetailModal";
import ProductFormModal from "../components/menu/ProductFormModal";
import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
} from "../constants/menuTheme";
import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";
import { mockCategories } from "../data/mockMenu"; // Mantenemos las categorías mock o tu fuente de categorías
import {
  createMenuItem,
  deleteMenuItem,
  getMenu,
  toggleItemAvailability,
  updateMenuItem,
} from "../services/api";
import { MenuItem, MenuItemDraft } from "../types/menu";
import { confirmAction } from "../utils/crossPlatformConfirm";

export default function MenuScreen() {
  const router = useRouter();
  const { isAdmin, logout } = useAdmin();
  const { addToCart, totalItems } = useCart();

  // Cambiamos el estado inicial de mockMenuItems a un array vacío para llenarlo desde la API/Base de datos
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todos" || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Función para cargar los productos desde la API / Base de datos
  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const data = await getMenu();
      setItems(data);
    } catch (error) {
      console.error("Error al cargar el menú:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const cartScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (totalItems === 0) return;
    Animated.sequence([
      Animated.spring(cartScale, {
        toValue: 1.25,
        useNativeDriver: true,
        speed: 20,
      }),
      Animated.spring(cartScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
      }),
    ]).start();
  }, [totalItems]);

  const openCreateForm = () => {
    if (!isAdmin) return;
    setEditingItem(null);
    setFormVisible(true);
  };

  const openDetail = (item: MenuItem) => {
    setDetailItem(item);
    setDetailVisible(true);
  };

  const toggleAvailability = async (item: MenuItem) => {
    if (!isAdmin) return;
    try {
      const updated = await toggleItemAvailability(item.id, !item.available);
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    } catch (error) {
      console.error("Error al cambiar disponibilidad:", error);
      loadMenuItems(); // Revertir en caso de error recargando
    }
  };

  const openEditForm = (item: MenuItem) => {
    if (!isAdmin) return;
    setDetailVisible(false);
    setEditingItem(item);
    setFormVisible(true);
  };

  const handleSave = async (draft: MenuItemDraft, id?: string) => {
    if (!isAdmin) return;
    try {
      if (id) {
        const updated = await updateMenuItem(id, draft);
        setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      } else {
        const newItem = await createMenuItem(draft);
        setItems((prev) => [newItem, ...prev]);
      }
      setFormVisible(false);
    } catch (error) {
      console.error("Error al guardar el producto:", error);
    }
  };

  const handleDelete = (item: MenuItem) => {
    if (!isAdmin) return;
    confirmAction(
      "Eliminar producto",
      `¿Quitar "${item.name}" del menú?`,
      async () => {
        try {
          await deleteMenuItem(item.id);
          setItems((prev) => prev.filter((it) => it.id !== item.id));
          setDetailVisible(false);
        } catch (error) {
          console.error("Error al eliminar el producto:", error);
        }
      },
      "Eliminar",
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Menú</Text>
          <Text style={styles.headerSubtitle}>{items.length} productos</Text>
        </View>

        {isAdmin ? (
          <Pressable style={styles.addButton} onPress={openCreateForm}>
            <Text style={styles.addButtonText}>+ Agregar</Text>
          </Pressable>
        ) : (
          <Animated.View style={{ transform: [{ scale: cartScale }] }}>
            <Pressable
              style={styles.cartHeaderButton}
              onPress={() => router.push("/cart")}
            >
              <Text style={styles.cartHeaderButtonText}>🛒</Text>
              {totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItems}</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        )}
      </View>

      {isAdmin && (
        <Pressable
          style={styles.logoutRow}
          onPress={() => {
            logout();
            router.replace("/");
          }}
        >
          <Text style={styles.logoutText}>Salir del modo administrador</Text>
        </Pressable>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar productos.."
        value={searchText}
        onChangeText={setSearchText}
      />

      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          <Pressable
            style={[
              styles.categoryButton,
              selectedCategory === "Todos" && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory("Todos")}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === "Todos" && styles.categoryTextActive,
              ]}
            >
              Todos
            </Text>
          </Pressable>

          {mockCategories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryButton,
                  isSelected && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {category.emoji} {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            isAdmin={isAdmin}
            onPress={() => openDetail(item)}
            onToggleAvailability={() => toggleAvailability(item)}
            onAddToCart={() => addToCart(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {loading
                ? "Cargando productos..."
                : "No hay productos aquí todavía"}
            </Text>
          </View>
        }
      />

      <ProductDetailModal
        item={detailItem}
        visible={detailVisible}
        isAdmin={isAdmin}
        onClose={() => setDetailVisible(false)}
        onEdit={openEditForm}
        onDelete={handleDelete}
        onAddToCart={(item, selectedOptions) => {
          addToCart(item, selectedOptions);
          setDetailVisible(false);
        }}
      />

      {isAdmin && (
        <ProductFormModal
          visible={formVisible}
          categories={mockCategories}
          initialItem={editingItem}
          onClose={() => setFormVisible(false)}
          onSave={handleSave}
        />
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    paddingBottom: 100,
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
  searchInput: {
    marginHorizontal: menuSpacing.lg,
    marginTop: menuSpacing.md,
    marginBottom: menuSpacing.sm,
    paddingHorizontal: menuSpacing.md,
    paddingVertical: menuSpacing.sm,
    borderWidth: 1,
    borderColor: menuColors.textSecondary,
    borderRadius: menuRadius.md,
    backgroundColor: menuColors.background,
    color: menuColors.textPrimary,
  },
  categoriesWrapper: {
    height: 50,
    marginBottom: menuSpacing.md,
  },
  categoriesContent: {
    paddingHorizontal: menuSpacing.lg,
    alignItems: "center",
  },
  categoryButton: {
    paddingHorizontal: menuSpacing.md,
    height: 38,
    justifyContent: "center",
    borderRadius: menuRadius.md,
    backgroundColor: "#E5E5E5",
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: menuColors.accent,
  },
  categoryText: {
    ...menuTypography.body,
    color: menuColors.textPrimary,
    fontSize: 13,
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: menuColors.textPrimary,
    paddingHorizontal: menuSpacing.md,
    height: 42,
    borderRadius: menuRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    ...menuTypography.body,
    color: menuColors.background,
    fontWeight: "bold",
  },
  cartHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: menuRadius.md,
    backgroundColor: "#C8E6C9",
    alignItems: "center",
    justifyContent: "center",
  },
  cartHeaderButtonText: {
    fontSize: 18,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: menuColors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  logoutRow: {
    paddingHorizontal: menuSpacing.lg,
    marginBottom: menuSpacing.sm,
  },
  logoutText: {
    ...menuTypography.body,
    fontSize: 13,
    color: menuColors.danger,
    fontWeight: "600",
  },
});
