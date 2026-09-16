import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { menuColors, menuRadius, menuSpacing } from "@/constants/menuTheme";

import { useAdmin } from "@/context/AdminContext";

export default function AppTabs() {
  const { isAdmin } = useAdmin();

  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />

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
  tabSlot: {
    flex: 1,
  },

  tabListContainer: {
    width: "100%",
    paddingHorizontal: menuSpacing.lg,
    paddingVertical: menuSpacing.sm,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: menuColors.background,
  },

  innerContainer: {
    width: "100%",
    maxWidth: 600,
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
    flex: 1,
    borderRadius: menuRadius.md,
  },

  tabButtonView: {
    paddingVertical: menuSpacing.sm,
    paddingHorizontal: menuSpacing.sm,
    borderRadius: menuRadius.md,
    backgroundColor: menuColors.surface,
    alignItems: "center",
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
