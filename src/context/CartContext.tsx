import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Alert } from "react-native";

import { MenuItem } from "../types/menu";

import {
  createOrder as apiCreateOrder,
  getOrderById,
  OrderStatus,
} from "../services/api";

const ORDERS_STORAGE_KEY = "@cafeteria/orders";

export type SelectedCustomization = {
  specId: string;
  specLabel: string;
  optionId: string;
  optionLabel: string;
  price: number;
};

export type CartItem = {
  id: string;
  product: MenuItem;
  quantity: number;
  unitPrice: number;
  customizations: SelectedCustomization[];
};

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  authCode: string;
  studentName: string;
};

type CartContextType = {
  cartItems: CartItem[];
  orders: Order[];

  addToCart: (
    product: MenuItem,
    selectedOptions?: Record<string, string>,
  ) => void;

  removeFromCart: (cartItemId: string) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  clearCart: () => void;

  /**
   * Envía el pedido al servidor, lo guarda en el historial local
   * (persistido en el dispositivo) y limpia el carrito.
   */
  createOrder: (studentName: string) => Promise<Order | null>;

  /**
   * Vuelve a consultar el estado de cada pedido guardado contra el
   * servidor, para reflejar los cambios que haga el administrador.
   */
  refreshOrders: () => Promise<void>;

  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const MAX_QUANTITY = 3;

const createCartItemId = () =>
  `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createCustomizationKey = (customizations: SelectedCustomization[]) => {
  return customizations
    .map((customization) => `${customization.specId}:${customization.optionId}`)
    .sort()
    .join("|");
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  /* Mantiene siempre la versión más reciente de "orders" disponible
     de forma síncrona, para que funciones como refreshOrders (que
     puede quedar "atrapada" dentro de un setInterval viejo) nunca
     trabajen con una lista desactualizada. */
  const ordersRef = useRef<Order[]>(orders);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  /* Al iniciar, recuperamos los pedidos que el cliente ya hizo antes
     (quedan guardados en el dispositivo aunque cierre la app). */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);

        if (stored) {
          setOrders(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error cargando pedidos guardados:", error);
      }
    })();
  }, []);

  const persistOrders = async (nextOrders: Order[]) => {
    try {
      await AsyncStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify(nextOrders),
      );
    } catch (error) {
      console.error("Error guardando pedidos:", error);
    }
  };

  const addToCart = (
    product: MenuItem,
    selectedOptions: Record<string, string> = {},
  ) => {
    const customizations: SelectedCustomization[] = [];

    const specs = Array.isArray(product.specs) ? product.specs : [];

    specs.forEach((spec) => {
      if (!spec || !Array.isArray(spec.options)) {
        return;
      }

      const selectedOptionId = selectedOptions[spec.id];

      const selectedOption =
        spec.options.find((option) => option.id === selectedOptionId) ??
        spec.options.find((option) => option.isDefault) ??
        spec.options[0];

      if (!selectedOption) {
        return;
      }

      customizations.push({
        specId: spec.id,
        specLabel: spec.label,
        optionId: selectedOption.id,
        optionLabel: selectedOption.label,
        price:
          Number.isFinite(selectedOption.price) && selectedOption.price >= 0
            ? selectedOption.price
            : 0,
      });
    });

    const customizationPrice = customizations.reduce(
      (total, customization) => total + customization.price,
      0,
    );

    const unitPrice = product.price + customizationPrice;

    const newCustomizationKey = createCustomizationKey(customizations);

    setCartItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex((item) => {
        if (item.product.id !== product.id) {
          return false;
        }

        const existingKey = createCustomizationKey(item.customizations);

        return existingKey === newCustomizationKey;
      });

      if (existingItemIndex !== -1) {
        const existingItem = currentItems[existingItemIndex];

        if (existingItem.quantity >= MAX_QUANTITY) {
          Alert.alert(
            "Límite alcanzado",
            "Llegaste al límite de este producto.",
          );

          return currentItems;
        }

        return currentItems.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      const newCartItem: CartItem = {
        id: createCartItemId(),
        product,
        quantity: 1,
        unitPrice,
        customizations,
      };

      return [...currentItems, newCartItem];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== cartItemId),
    );
  };

  const increaseQuantity = (cartItemId: string) => {
    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== cartItemId) {
          return item;
        }

        if (item.quantity >= MAX_QUANTITY) {
          Alert.alert(
            "Límite alcanzado",
            "Llegaste al límite de este producto.",
          );

          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }),
    );
  };

  const decreaseQuantity = (cartItemId: string) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === cartItemId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const createOrder = async (studentName: string): Promise<Order | null> => {
    if (cartItems.length === 0) {
      Alert.alert(
        "Carrito vacío",
        "Agrega productos antes de realizar el pedido.",
      );

      return null;
    }

    if (!studentName.trim()) {
      Alert.alert(
        "Falta tu nombre",
        "Escribe tu nombre para poder identificar tu pedido.",
      );

      return null;
    }

    try {
      const backendOrder = await apiCreateOrder({
        items: cartItems,
        total: totalPrice,
        studentName: studentName.trim(),
      });

      const order: Order = {
        id: backendOrder.id,
        items: cartItems,
        total: totalPrice,
        status: backendOrder.status,
        createdAt: backendOrder.createdAt,
        studentName: studentName.trim(),
        authCode: String(backendOrder.authCode ?? ""),
      };

      /* Usamos ordersRef (siempre actualizado) como base, en vez de
         la variable "orders" del closure, por la misma razón que en
         refreshOrders: evita pisar pedidos si hay una actualización
         en curso al mismo tiempo. */
      const nextOrders = [order, ...ordersRef.current];

      setOrders(nextOrders);
      ordersRef.current = nextOrders;
      await persistOrders(nextOrders);

      setCartItems([]);

      return order;
    } catch (error) {
      console.error("Error creando el pedido:", error);

      Alert.alert(
        "No se pudo enviar tu pedido",
        "Revisa tu conexión e intenta de nuevo.",
      );

      return null;
    }
  };

  /* Consulta el estado más reciente de cada pedido en el servidor,
     para enterarse si el administrador ya lo cambió. Lee siempre
     ordersRef.current (no la variable "orders" del closure) para
     no pisar pedidos nuevos con una lista vieja capturada por un
     setInterval que quedó "congelado" desde que se montó la
     pantalla de pedidos. */
  const refreshOrders = async () => {
    const currentOrders = ordersRef.current;

    if (currentOrders.length === 0) return;

    try {
      const updated = await Promise.all(
        currentOrders.map(async (order) => {
          try {
            const backendOrder = await getOrderById(order.id);

            return {
              ...order,
              status: backendOrder.status,
              authCode: String(backendOrder.authCode ?? order.authCode),
            };
          } catch {
            /* Si falla un pedido en particular, dejamos el que ya
               teníamos guardado en vez de romper toda la lista. */
            return order;
          }
        }),
      );

      setOrders(updated);
      ordersRef.current = updated;
      await persistOrders(updated);
    } catch (error) {
      console.error("Error actualizando pedidos:", error);
    }
  };

  const totalItems = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      ),
    [cartItems],
  );

  const value: CartContextType = {
    cartItems,
    orders,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    createOrder,
    refreshOrders,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe utilizarse dentro de CartProvider");
  }

  return context;
}
