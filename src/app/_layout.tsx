import { DefaultTheme, ThemeProvider } from "expo-router";

import AppTabs from "@/components/app-tabs";

import { AdminProvider } from "../context/AdminContext";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
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