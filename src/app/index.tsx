import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AdminLoginModal from "@/components/admin/AdminLoginModal";
<<<<<<< HEAD
import {
  menuRadius,
  menuSpacing,
  menuTypography,
  WEB_MAX_WIDTH,
} from "@/constants/menuTheme";
import { useAdmin } from "@/context/AdminContext";
=======
import { useAdmin } from "@/context/AdminContext";

>>>>>>> gabriel
import {
  deletePromotion,
  getPromotion,
  savePromotion,
  uploadPromoImage,
  type Promotion,
} from "@/services/api";
import { confirmAction, showAlert } from "@/utils/crossPlatformConfirm";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const IS_WEB = Platform.OS === "web";

/*
 * En web el contenido ya está limitado a WEB_MAX_WIDTH (ver
 * app-tabs.web.tsx), así que el carrusel debe calcular su tamaño
 * en base a ese ancho "de celular" y no al ancho real de la
 * ventana del navegador, o se vería enorme y descentrado.
 */
const EFFECTIVE_WIDTH = IS_WEB
  ? Math.min(screenWidth, WEB_MAX_WIDTH)
  : screenWidth;

const CONTAINER_WIDTH = EFFECTIVE_WIDTH - menuSpacing.lg * 2;

const SLIDE_WIDTH = IS_WEB
  ? Math.min(CONTAINER_WIDTH * 0.65, 520)
  : CONTAINER_WIDTH * 0.88;

const SLIDE_HEIGHT = IS_WEB
  ? Math.min(screenHeight * 0.42, 360)
  : SLIDE_WIDTH * 1.45;

const SLIDE_INTERVAL_MS = 4000;

function PromoCarousel({ promotion }: { promotion: Promotion | null }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const listRef = useRef<FlatList<Promotion>>(null);

  const promos = promotion ? [promotion] : [];

  useEffect(() => {
    if (promos.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % promos.length;

        listRef.current?.scrollToIndex({
          index: next,
          animated: true,
        });

        return next;
      });
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [promos.length]);

  if (!promotion) {
    return (
      <View style={styles.carouselContainer}>
        <View
          style={[
            styles.emptyPromo,
            {
              width: SLIDE_WIDTH,
              height: SLIDE_HEIGHT,
            },
          ]}
        >
          <Text style={styles.emptyPromoEmoji}>☕</Text>

          <Text style={styles.emptyPromoTitle}>Bienvenidos a Mas Café</Text>

          <Text style={styles.emptyPromoSubtitle}>
            Consulta nuestras promociones próximamente.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={listRef}
        data={promos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: CONTAINER_WIDTH,
          offset: CONTAINER_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / CONTAINER_WIDTH,
          );

          setActiveIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={styles.slideWrapper}>
            <View
              style={[
                styles.promoCard,
                {
                  width: SLIDE_WIDTH,
                  height: SLIDE_HEIGHT,
                },
              ]}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.promoImage}
                resizeMode="cover"
              />
            </View>
          </View>
        )}
      />

      {promos.length > 1 && (
        <View style={styles.dots}>
          {promos.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

<<<<<<< HEAD
  /*
   * IMPORTANTE:
   * El estado de administrador ahora viene del AdminContext.
   * Así index.tsx y order.tsx utilizan exactamente la misma sesión.
   */
  const { isAdmin, logout } = useAdmin();

  const [adminModalVisible, setAdminModalVisible] = useState(false);
=======
  const { 
    isAdmin, 
    isStoreOpen, 
    setIsStoreOpen,
    logout,
  } = useAdmin();

  const [adminModalVisible, setAdminModalVisible] = useState(false);

>>>>>>> gabriel

  const [promotion, setPromotion] = useState<Promotion | null>(null);

  const [isLoadingPromotion, setIsLoadingPromotion] = useState(true);

  const [isSavingPromotion, setIsSavingPromotion] = useState(false);

  // Doble toque para abrir el acceso de administrador en móvil.
  const lastPressTimeRef = useRef(0);

  useEffect(() => {
    void loadPromotion();
  }, []);

  const loadPromotion = async () => {
    try {
      setIsLoadingPromotion(true);

      const data = await getPromotion();

      setPromotion(data);
    } catch (error) {
      console.error("Error cargando promoción:", error);
    } finally {
      setIsLoadingPromotion(false);
    }
  };

  const handleAdminSecretTrigger = () => {
    const now = Date.now();

    if (now - lastPressTimeRef.current < 600) {
      setAdminModalVisible(true);
      lastPressTimeRef.current = 0;
      return;
    }

    lastPressTimeRef.current = now;
  };

  const handleSelectPromotionImage = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert(
          "Permiso necesario",
          "Necesitamos permiso para seleccionar una imagen.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const imageUri = result.assets[0].uri;

      setIsSavingPromotion(true);

      // 1. Subir imagen a Cloudinary.
      const uploaded = await uploadPromoImage(imageUri);

      // 2. Guardar URL + publicId en Firestore.
      const saved = await savePromotion({
        imageUrl: uploaded.url,
        publicId: uploaded.publicId,
      });

      // 3. Actualizar inmediatamente la pantalla.
      setPromotion(saved);

      showAlert(
        "Promoción actualizada",
        "La imagen de promoción se guardó correctamente.",
      );
    } catch (error) {
      console.error("Error actualizando promoción:", error);

      showAlert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la promoción.",
      );
    } finally {
      setIsSavingPromotion(false);
    }
  };

  const handleDeletePromotion = () => {
    if (!isAdmin || !promotion) {
      return;
    }

    const executeDelete = async () => {
      try {
        setIsSavingPromotion(true);

        await deletePromotion();

        setPromotion(null);

        showAlert(
          "Promoción eliminada",
          "La promoción se eliminó correctamente.",
        );
      } catch (error) {
        console.error("Error eliminando promoción:", error);

        const message =
          error instanceof Error
            ? error.message
            : "No se pudo eliminar la promoción.";

        showAlert("Error", message);
      } finally {
        setIsSavingPromotion(false);
      }
    };

    confirmAction(
      "Eliminar promoción",
      "¿Seguro que quieres eliminar la promoción actual?",
      () => {
        void executeDelete();
      },
      "Eliminar",
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* =========================
          ENCABEZADO
      ========================= */}

      <View style={styles.header}>
        <Text style={styles.welcomeLabel}>BIENVENIDOS A</Text>

        <Pressable onPress={handleAdminSecretTrigger} hitSlop={15}>
          <Text style={styles.brandTitle}>Mas Café</Text>
        </Pressable>
      </View>

      {/* =========================
          CARRUSEL
      ========================= */}

      <PromoCarousel promotion={promotion} />

      {/* =========================
          ADMINISTRACIÓN

          SOLAMENTE ADMIN
      ========================= */}

      {isAdmin && (
        <View style={styles.adminPanel}>
          <Text style={styles.adminTitle}>Administración de promoción</Text>

          <Text style={styles.adminSubtitle}>
            {promotion
              ? "Puedes cambiar o eliminar la imagen actual."
              : "Todavía no hay una promoción publicada."}
          </Text>
          <View style={styles.storeControl}>
            <View style={styles.storeControlInfo}>
              <Text style={styles.storeControlTitle}>
                Cafeteria
              </Text>

              <Text style={styles.storeControlStatus}>
                {isStoreOpen
                  ? "Abierta · Los clientes pueden realizar pedidos."
                  : "Cerrada · Los clientes no pueden realizar pedidos."
                }
              </Text>
            </View>

            <Switch
              value={isStoreOpen}
              onValueChange={(value) => {
                setIsStoreOpen(value);
              }}
            />
          </View>

          <View style={styles.adminActions}>
            <Pressable
              disabled={isSavingPromotion}
              onPress={handleSelectPromotionImage}
              style={({ pressed }) => [
                styles.adminActionButton,
                pressed && !isSavingPromotion && styles.buttonPressed,
                isSavingPromotion && styles.disabledButton,
              ]}
            >
              <Text style={styles.adminActionText}>
                {isSavingPromotion
                  ? "Guardando..."
                  : promotion
                    ? "Cambiar imagen"
                    : "Subir promoción"}
              </Text>
            </Pressable>

            {promotion && (
              <Pressable
                disabled={isSavingPromotion}
                onPress={handleDeletePromotion}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && !isSavingPromotion && styles.buttonPressed,
                  isSavingPromotion && styles.disabledButton,
                ]}
              >
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* =========================
          BOTÓN MENÚ
      ========================= */}

      <Pressable
        style={({ pressed }) => [
          styles.menuButton,
          pressed && styles.menuButtonPressed,
        ]}
        onPress={() => {
          router.push("/menu");
        }}
      >
        <Text style={styles.menuButtonText}>Ir al Menú</Text>
      </Pressable>

      {/* =========================
          ACCESO ADMINISTRADOR WEB
      ========================= */}

      {!isAdmin && IS_WEB && (
        <Pressable
          onPress={() => setAdminModalVisible(true)}
          style={({ pressed }) => [
            styles.webAdminButton,
            pressed && styles.webAdminButtonPressed,
          ]}
        >
          <Text style={styles.webAdminText}>Administrador</Text>
        </Pressable>
      )}

      {/* =========================
          CERRAR ADMIN
      ========================= */}

      {isAdmin && (
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.webAdminButtonPressed,
          ]}
        >
          <Text style={styles.webAdminText}>Cerrar administración</Text>
        </Pressable>
      )}

      {/* =========================
          LOGIN ADMINISTRADOR
      ========================= */}

      <AdminLoginModal
        visible={adminModalVisible}
        onClose={() => setAdminModalVisible(false)}
        onSuccess={() => {
          /*
           * AdminLoginModal ya ejecuta login()
           * mediante AdminContext.
           */
          setAdminModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: menuSpacing.lg,
    paddingTop: IS_WEB ? menuSpacing.md : menuSpacing.xl,
    paddingBottom: IS_WEB ? menuSpacing.md : menuSpacing.xl,
  },

  header: {
    alignItems: "center",
    gap: 4,
    marginBottom: IS_WEB ? 18 : 32,
  },

  welcomeLabel: {
    ...menuTypography.label,
    color: "#666666",
    letterSpacing: 2,
    fontSize: 15,
    fontWeight: "700",
  },

  brandTitle: {
    ...menuTypography.title,
    fontSize: 31,
    fontWeight: "800",
    color: "#222222",
    textAlign: "center",
  },

  carouselContainer: {
    width: "100%",
    alignItems: "center",
  },

  slideWrapper: {
    width: CONTAINER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },

  promoCard: {
    backgroundColor: "#F7F3EE",
    borderRadius: menuRadius.lg,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    overflow: "hidden",
  },

  promoImage: {
    width: "100%",
    height: "100%",
  },

  emptyPromo: {
    backgroundColor: "#F7F3EE",
    borderRadius: menuRadius.lg,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: menuSpacing.lg,
    gap: menuSpacing.sm,
  },

  emptyPromoEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },

  emptyPromoTitle: {
    ...menuTypography.title,
    fontSize: 18,
    fontWeight: "700",
    color: "#7A4B2A",
    textAlign: "center",
  },

  emptyPromoSubtitle: {
    ...menuTypography.body,
    color: "#666666",
    textAlign: "center",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DDDDDD",
  },

  dotActive: {
    backgroundColor: "#7A4B2A",
    width: 18,
  },

  adminPanel: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    marginTop: 16,
    padding: menuSpacing.md,
    backgroundColor: "#F7F3EE",
    borderRadius: menuRadius.md,
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },

  adminTitle: {
    ...menuTypography.title,
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
  },

  adminSubtitle: {
    ...menuTypography.body,
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
  },

  adminActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },

  adminActionButton: {
    backgroundColor: "#7A4B2A",
    borderRadius: menuRadius.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  adminActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  deleteButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C94A4A",
    borderRadius: menuRadius.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  deleteButtonText: {
    color: "#C94A4A",
    fontWeight: "700",
    fontSize: 13,
  },

  disabledButton: {
    opacity: 0.5,
  },

  menuButton: {
    backgroundColor: "#7A4B2A",
    paddingVertical: menuSpacing.md + 4,
    borderRadius: menuRadius.md,
    alignItems: "center",
    marginTop: "auto",
  },

  menuButtonPressed: {
    opacity: 0.85,
  },

  menuButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  webAdminButton: {
    alignSelf: "center",
    marginTop: 8,
    padding: 6,
  },

  webAdminButtonPressed: {
    opacity: 0.6,
  },

  webAdminText: {
    fontSize: 11,
    color: "#999999",
  },

  logoutButton: {
    alignSelf: "center",
    marginTop: 4,
    padding: 6,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  //SWITCH ADMINISTRADOR
  storeControl: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 16,
  padding: 12,
  backgroundColor: "#FFFFFF",
  borderRadius: menuRadius.md,
  borderWidth: 1,
  borderColor: "#DDDDDD",
},

storeControlInfo: {
  flex: 1,
  paddingRight: 12,
},

storeControlTitle: {
  fontSize: 15,
  fontWeight: "700",
  color: "#222222",
},

storeControlStatus: {
  fontSize: 12,
  color: "#666666",
  marginTop: 3,
},
});
