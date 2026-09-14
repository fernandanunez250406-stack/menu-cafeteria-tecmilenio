import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import AdminLoginModal from "@/components/admin/AdminLoginModal";

import { menuRadius, menuSpacing, menuTypography } from "@/constants/menuTheme";

type Promo = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
};

const promos: Promo[] = [
  {
    id: "1",
    emoji: "☕",
    title: "2x1 en Latte Vainilla",
    subtitle: "Todos los martes, 8am–11am",
  },
  {
    id: "2",
    emoji: "🥐",
    title: "Combo desayuno",
    subtitle: "Café + pan dulce por $35",
  },
  {
    id: "3",
    emoji: "🍋",
    title: "Limonada Menta",
    subtitle: "Refréscate esta semana a $30",
  },
];

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const IS_WEB = Platform.OS === "web";

const CONTAINER_WIDTH = screenWidth - menuSpacing.lg * 2;

const SLIDE_WIDTH = IS_WEB
  ? Math.min(CONTAINER_WIDTH * 0.65, 520)
  : CONTAINER_WIDTH * 0.88;

const SLIDE_HEIGHT = IS_WEB
  ? Math.min(screenHeight * 0.42, 360)
  : SLIDE_WIDTH * 1.45;

const SLIDE_INTERVAL_MS = 4000;

function PromoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const listRef = useRef<FlatList<Promo>>(null);

  useEffect(() => {
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
  }, []);

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
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(
            e.nativeEvent.contentOffset.x / CONTAINER_WIDTH,
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
              <Text style={styles.promoEmoji}>{item.emoji}</Text>

              <Text style={styles.promoTitle}>{item.title}</Text>

              <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.dots}>
        {promos.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const [adminModalVisible, setAdminModalVisible] = useState(false);

  // Doble toque para móvil
  const lastPressTimeRef = useRef(0);

  const handleAdminSecretTrigger = () => {
    const now = Date.now();

    if (now - lastPressTimeRef.current < 600) {
      setAdminModalVisible(true);
      lastPressTimeRef.current = 0;
      return;
    }

    lastPressTimeRef.current = now;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* =========================
          ENCABEZADO
      ========================= */}

      <View style={styles.header}>
        <Text style={styles.welcomeLabel}>BIENVENIDOS A</Text>

        {/* Acceso oculto para móvil */}
        <Pressable onPress={handleAdminSecretTrigger} hitSlop={15}>
          <Text style={styles.brandTitle}>Mas Café</Text>
        </Pressable>
      </View>

      {/* =========================
          CARRUSEL
      ========================= */}

      <PromoCarousel />

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

      {Platform.OS === "web" && (
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
          LOGIN ADMINISTRADOR
      ========================= */}

      <AdminLoginModal
        visible={adminModalVisible}
        onClose={() => setAdminModalVisible(false)}
        onSuccess={() => {
          setAdminModalVisible(false);
          router.push("/menu");
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

  // =========================
  // ENCABEZADO
  // =========================

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

  // =========================
  // CARRUSEL
  // =========================

  carouselContainer: {
    width: "100%",
    alignItems: "center",
  },

  slideWrapper: {
    width: CONTAINER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },

  // =========================
  // TARJETA DE PROMOCIÓN
  // =========================

  promoCard: {
    backgroundColor: "#F7F3EE",
    borderRadius: menuRadius.lg,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    paddingHorizontal: menuSpacing.lg,
    paddingVertical: IS_WEB ? 20 : 30,
    alignItems: "center",
    justifyContent: "center",
    gap: menuSpacing.sm,
  },

  promoEmoji: {
    fontSize: IS_WEB ? 32 : 38,
    textAlign: "center",
    alignSelf: "center",
    marginBottom: 4,
  },

  promoTitle: {
    ...menuTypography.title,
    fontSize: 18,
    fontWeight: "700",
    color: "#7A4B2A",
    textAlign: "center",
  },

  promoSubtitle: {
    ...menuTypography.body,
    color: "#666666",
    textAlign: "center",
  },

  // =========================
  // INDICADORES
  // =========================

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

  // =========================
  // BOTÓN MENÚ
  // =========================

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

  // =========================
  // ADMINISTRADOR WEB
  // =========================

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
});
