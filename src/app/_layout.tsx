import { DefaultTheme, ThemeProvider } from "expo-router";
import { useEffect } from "react";

import AppTabs from "@/components/app-tabs";

import { AdminProvider } from "../context/AdminContext";
import { CartProvider } from "../context/CartContext";
import { registerForPushNotificationsAsync } from "../services/notifications";

export default function RootLayout() {
  useEffect(() => {
    const registerNotifications = async () => {
      await registerForPushNotificationsAsync();
    };

    void registerNotifications();
  }, []);

  return (
    <AdminProvider>
      <CartProvider>
        <ThemeProvider value={DefaultTheme}>
          <AppTabs />
        </ThemeProvider>
      </CartProvider>
    </AdminProvider>
  );
}
