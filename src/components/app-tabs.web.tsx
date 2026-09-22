import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { menuColors, menuRadius } from "@/constants/menuTheme";

import { useAdmin } from "@/context/AdminContext";

const DESKTOP_MAX_WIDTH = 1200;

export default function AppTabs() {
  const { isAdmin } = useAdmin();

  return (
    <Tabs>
      {/* CONTENIDO PRINCIPAL */}
      <View style={styles.webPage}>
        <View style={styles.webCard}>
          <TabSlot style={styles.tabSlot} />
        </View>
      </View>

      {/* NAVEGACIÓN */}
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>

          <TabTrigger name="menu" href="/menu" asChild>
            <TabButton>Menú</TabButton>
          </TabTrigger>

          {!isAdmin && (
            <TabTrigger name="cart" href="/cart" asChild>
              <TabButton>Carrito</TabButton>
            </TabTrigger>
          )}

          <TabTrigger name="order" href="/order" asChild>
            <TabButton>Pedidos</TabButton>
          </TabTrigger>

          {isAdmin && (
            <TabTrigger name="earnings" href="/earnings" asChild>
              <TabButton>Ganancias</TabButton>
            </TabTrigger>
          )}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

/* =========================================================
   BOTÓN
   ========================================================= */

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
    >
      <View
        style={[styles.tabButtonView, isFocused && styles.tabButtonViewFocused]}
      >
        <Text style={[styles.tabText, isFocused && styles.tabTextFocused]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  );
}

/* =========================================================
   ESTILOS
   ========================================================= */

const styles = StyleSheet.create({
  /*
   * TODA LA PANTALLA
   */
  webPage: {
    flex: 1,
    width: "100%",

    alignItems: "center",

    backgroundColor: "#EDE7E0",

    overflowY: "auto",
  },

  /*
   * APLICACIÓN EN PC
   *
   * Antes:
   * maxWidth: WEB_MAX_WIDTH
   *
   * Eso hacía que pareciera una app de celular.
   *
   * Ahora:
   * hasta 1200px en PC.
   */
  webCard: {
    flex: 1,

    width: "100%",
    maxWidth: DESKTOP_MAX_WIDTH,

    backgroundColor: menuColors.background,

    boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
  },

  tabSlot: {
    flex: 1,
    width: "100%",
  },

  /*
   * BARRA INFERIOR
   */
  tabListContainer: {
    width: "100%",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 24,
    paddingVertical: 14,

    backgroundColor: "#EDE7E0",
  },

  /*
   * CONTENEDOR DE BOTONES
   */
  innerContainer: {
    width: "100%",
    maxWidth: DESKTOP_MAX_WIDTH,

    minHeight: 64,

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: menuRadius.lg,

    flexDirection: "row",

    justifyContent: "center",
    alignItems: "center",

    gap: 10,

    backgroundColor: menuColors.surface,

    borderWidth: 1,
    borderColor: menuColors.border,

    boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
  },

  /*
   * BOTONES
   */
  tabButton: {
    minWidth: 120,

    borderRadius: menuRadius.md,
  },

  tabButtonView: {
    minHeight: 46,

    paddingHorizontal: 28,
    paddingVertical: 11,

    borderRadius: menuRadius.md,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: menuColors.surface,
  },

  /*
   * BOTÓN SELECCIONADO
   */
  tabButtonViewFocused: {
    backgroundColor: menuColors.accentSoft,
  },

  /*
   * TEXTO
   */
  tabText: {
    fontSize: 15,

    fontWeight: "600",

    color: menuColors.textSecondary,

    textAlign: "center",
  },

  tabTextFocused: {
    color: menuColors.accent,

    fontWeight: "700",
  },

  pressed: {
    opacity: 0.65,
  },
});
