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

import { MenuItem } from "../types/menu";

import {
  createOrder as apiCreateOrder,
  getOrders,
  OrderStatus,
} from "../services/api";

import { showAlert } from "../utils/crossPlatformConfirm";

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
  updatedAt?: string;
  authCode: string;
  studentName: string;

  // Información adicional enviada por el servidor
  cancellationReason?: string;
  cancelledAt?: string;
  notice?: string;
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
   * y limpia el carrito.
   */
  createOrder: (studentName: string) => Promise<Order | null>;

  /**
   * Consulta nuevamente los pedidos en el servidor para reflejar
   * cambios realizados por el administrador.
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

  const ordersRef = useRef<Order[]>(orders);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  /*
   * Recuperar pedidos guardados localmente al iniciar.
   */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);

        if (stored) {
          const parsedOrders: Order[] = JSON.parse(stored);

          setOrders(parsedOrders);
          ordersRef.current = parsedOrders;
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
          showAlert("Límite alcanzado", "Llegaste al límite de este producto.");

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
          showAlert("Límite alcanzado", "Llegaste al límite de este producto.");

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
      showAlert(
        "Carrito vacío",
        "Agrega productos antes de realizar el pedido.",
      );

      return null;
    }

    if (!studentName.trim()) {
      showAlert(
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
        updatedAt: backendOrder.updatedAt,
        studentName: studentName.trim(),
        authCode: String(backendOrder.authCode ?? ""),
        cancellationReason: backendOrder.cancellationReason,
        cancelledAt: backendOrder.cancelledAt,
        notice: backendOrder.notice,
      };

      const nextOrders = [order, ...ordersRef.current];

      setOrders(nextOrders);
      ordersRef.current = nextOrders;

      await persistOrders(nextOrders);

      setCartItems([]);

      return order;
    } catch (error) {
      console.error("Error creando el pedido:", error);

      showAlert(
        "No se pudo enviar tu pedido",
        "Revisa tu conexión e intenta de nuevo.",
      );

      return null;
    }
  };

  /*
   * =========================================================
   * ACTUALIZAR PEDIDOS
   *
   * Antes se consultaba cada pedido individualmente:
   *
   * /orders/:id
   *
   * Eso provocaba errores cuando AsyncStorage tenía pedidos
   * antiguos que ya no existían en Firestore.
   *
   * Ahora hacemos UNA sola petición:
   *
   * /orders
   *
   * y sincronizamos los pedidos que todavía existen.
   * =========================================================
   */
  const refreshOrders = async () => {
    const currentOrders = ordersRef.current;

    if (currentOrders.length === 0) {
      return;
    }

    try {
      const backendOrders = await getOrders();

      /*
       * Mapa de pedidos actuales del servidor.
       */
      const backendOrdersMap = new Map(
        backendOrders.map((order) => [order.id, order]),
      );

      const updated = currentOrders.map((order) => {
        const backendOrder = backendOrdersMap.get(order.id);

        /*
         * Si el pedido local ya no existe
         * en Firestore, lo conservamos
         * localmente y dejamos de intentar
         * consultarlo individualmente.
         */
        if (!backendOrder) {
          return order;
        }

        /*
         * Si existe, sincronizamos TODOS
         * los datos importantes.
         */
        return {
          ...order,

          items: Array.isArray(backendOrder.items)
            ? backendOrder.items
            : order.items,

          total:
            typeof backendOrder.total === "number"
              ? backendOrder.total
              : order.total,

          status: backendOrder.status ?? order.status,

          authCode: String(backendOrder.authCode ?? order.authCode),

          studentName: backendOrder.studentName ?? order.studentName,

          createdAt: backendOrder.createdAt ?? order.createdAt,

          updatedAt: backendOrder.updatedAt ?? order.updatedAt,

          cancellationReason: backendOrder.cancellationReason,

          cancelledAt: backendOrder.cancelledAt,

          notice: backendOrder.notice,
        };
      });

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
