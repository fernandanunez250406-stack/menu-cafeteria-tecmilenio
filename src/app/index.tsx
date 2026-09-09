import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AdminLoginModal from "@/components/admin/AdminLoginModal";
import {
  menuColors,
  menuRadius,
  menuSpacing,
  menuTypography,
} from "@/constants/menuTheme";

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

const { width: screenWidth } = Dimensions.get("window");

// Ancho total disponible.
const CONTAINER_WIDTH = screenWidth - menuSpacing.lg * 2;

// La tarjeta será más delgada y centrada.
const SLIDE_WIDTH = CONTAINER_WIDTH * 0.88;

// Tarjeta vertical.
const SLIDE_HEIGHT = SLIDE_WIDTH * 1.45;

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
  const [lastPressTime, setLastPressTime] = useState(0);

  // Detecta doble clic (web) o doble toque rápido (móvil) en el título
  const handleAdminSecretTrigger = () => {
    const now = Date.now();
    if (now - lastPressTime < 400) {
      setAdminModalVisible(true);
    }
    setLastPressTime(now);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ENCABEZADO */}
      <View style={styles.header}>
        <Text style={styles.welcomeLabel}>BIENVENIDOS A</Text>

        {/* Título interactivo y oculto para el admin */}
        <Pressable onPress={handleAdminSecretTrigger} hitSlop={10}>
          <Text style={styles.brandTitle}>Cafetería Tecmilenio</Text>
        </Pressable>
      </View>

      {/* CARRUSEL */}
      <PromoCarousel />

      {/* BOTÓN */}
      <Pressable
        style={styles.menuButton}
        onPress={() => {
          router.push("/menu");
        }}
      >
        <Text style={styles.menuButtonText}>Ir al Menú</Text>
      </Pressable>

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
    backgroundColor: menuColors.background,
    paddingHorizontal: menuSpacing.lg,
    paddingTop: menuSpacing.xl,
    paddingBottom: menuSpacing.xl,
  },

  // =========================
  // ENCABEZADO
  // =========================

  header: {
    alignItems: "center",
    gap: 4,
    marginBottom: 32,
  },

  welcomeLabel: {
    ...menuTypography.label,
    color: menuColors.textSecondary,
    letterSpacing: 2,
    fontSize: 15,
    fontWeight: "700",
  },

  brandTitle: {
    ...menuTypography.title,
    fontSize: 31,
    fontWeight: "800",
    color: menuColors.textPrimary,
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
  // TARJETA
  // =========================

  promoCard: {
    backgroundColor: menuColors.accentSoft,
    borderRadius: menuRadius.lg,
    paddingHorizontal: menuSpacing.lg,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: menuSpacing.sm,
  },

  promoEmoji: {
    fontSize: 38,
    textAlign: "center",
    alignSelf: "center",
    marginBottom: 4,
  },

  promoTitle: {
    ...menuTypography.title,
    fontSize: 18,
    color: menuColors.accent,
    textAlign: "center",
  },

  promoSubtitle: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    textAlign: "center",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: menuColors.border,
  },

  dotActive: {
    backgroundColor: menuColors.accent,
    width: 18,
  },

  menuButton: {
    backgroundColor: menuColors.accent,
    paddingVertical: menuSpacing.md + 4,
    borderRadius: menuRadius.md,
    alignItems: "center",
    marginTop: "auto",
  },

  menuButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
