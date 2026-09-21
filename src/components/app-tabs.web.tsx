import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";

import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  menuColors,
  menuRadius,
  menuSpacing,
  WEB_MAX_WIDTH,
} from "@/constants/menuTheme";

import { useAdmin } from "@/context/AdminContext";

export default function AppTabs() {
  const { isAdmin } = useAdmin();

  return (
    <Tabs>
      {/*
       * En web centramos todo el contenido dentro de una "tarjeta"
       * de ancho fijo (como si fuera un celular), en vez de dejar
       * que se estire por toda la ventana. En la app móvil esto
       * no afecta nada porque la pantalla ya es angosta.
       */}
      <View style={styles.webPage}>
        <View style={styles.webCard}>
          <TabSlot style={styles.tabSlot} />
        </View>
      </View>

      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>

          <TabTrigger name="menu" href="/menu" asChild>
            <TabButton>Menú</TabButton>
          </TabTrigger>

          {/* El carrito solo tiene sentido para el cliente */}
          {!isAdmin && (
            <TabTrigger name="cart" href="/cart" asChild>
              <TabButton>Carrito</TabButton>
            </TabTrigger>
          )}

          <TabTrigger name="order" href="/order" asChild>
            <TabButton>{isAdmin ? "Pedidos (admin)" : "Pedidos"}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

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

function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webPage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#EDE7E0",
    overflowY: "auto",
  },

  webCard: {
    flex: 1,
    width: "100%",
    maxWidth: WEB_MAX_WIDTH,
    backgroundColor: menuColors.background,
    boxShadow: "0 0 40px rgba(0,0,0,0.08)",
  },

  tabSlot: {
    flex: 1,
  },

  tabListContainer: {
    width: "100%",
    paddingHorizontal: menuSpacing.lg,
    paddingVertical: menuSpacing.sm,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#EDE7E0",
  },

  innerContainer: {
    width: "100%",
    maxWidth: WEB_MAX_WIDTH,

    paddingVertical: menuSpacing.sm,
    paddingHorizontal: menuSpacing.sm,

    borderRadius: menuRadius.lg,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: menuSpacing.sm,

    backgroundColor: menuColors.surface,

    borderWidth: 1,
    borderColor: menuColors.border,
  },

  tabButton: {
    borderRadius: menuRadius.md,
  },

  tabButtonView: {
    paddingVertical: menuSpacing.sm,
    paddingHorizontal: menuSpacing.lg,

    borderRadius: menuRadius.md,

    backgroundColor: menuColors.surface,
  },

  tabButtonViewFocused: {
    backgroundColor: menuColors.accentSoft,
  },

  tabText: {
    fontSize: 14,
    fontWeight: "600",

    color: menuColors.textSecondary,
  },

  tabTextFocused: {
    color: menuColors.accent,
  },

  pressed: {
    opacity: 0.7,
  },
});
