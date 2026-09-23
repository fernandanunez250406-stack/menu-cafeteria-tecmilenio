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

import { Platform } from "react-native";

import { MenuItem } from "../types/menu";

import {
  createOrder as apiCreateOrder,
  getOrders,
  OrderStatus,
} from "../services/api";

import { registerForPushNotificationsAsync } from "../services/notifications";

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

  createOrder: (studentName: string) => Promise<Order | null>;

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
  const [pushToken, setPushToken] = useState<string | null>(null);

  const ordersRef = useRef<Order[]>(orders);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  /* =========================================================
     REGISTRAR NOTIFICACIONES PUSH

     IMPORTANTE:
     En web las notificaciones no deben bloquear el flujo
     de creación del pedido.
  ========================================================= */

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const registerNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();

        if (token) {
          setPushToken(token);
        }
      } catch (error) {
        console.error("Error registrando notificaciones push:", error);
      }
    };

    void registerNotifications();
  }, []);

  /* =========================================================
     RECUPERAR PEDIDOS GUARDADOS LOCALMENTE
  ========================================================= */

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

  /* =========================================================
     AGREGAR PRODUCTO AL CARRITO
  ========================================================= */

  const addToCart = (
    product: MenuItem,
    selectedOptions: Record<string, string> = {},
  ) => {
    /*
     * Si el producto completo está agotado,
     * nunca debe agregarse al carrito.
     */

    if (product.available === false) {
      showAlert(
        "Producto no disponible",
        `${product.name} no está disponible en este momento.`,
      );

      return;
    }

    const customizations: SelectedCustomization[] = [];

    const specs = Array.isArray(product.specs) ? product.specs : [];

    /*
     * Revisamos cada especificación.
     */

    for (const spec of specs) {
      if (!spec || !Array.isArray(spec.options) || spec.options.length === 0) {
        continue;
      }

      /*
       * Una opción está disponible si:
       * - available === true
       * - o no tiene el campo available.
       */

      const availableOptions = spec.options.filter(
        (option) => option && option.available !== false,
      );

      /*
       * Si ninguna opción está disponible,
       * no podemos completar el producto.
       */

      if (availableOptions.length === 0) {
        showAlert(
          "Opción no disponible",
          `No hay opciones disponibles para "${spec.label}" en ${product.name}.`,
        );

        return;
      }

      const selectedOptionId = selectedOptions[spec.id];

      /*
       * Primero intentamos utilizar exactamente
       * la opción seleccionada por el cliente.
       */

      let selectedOption = availableOptions.find(
        (option) => option.id === selectedOptionId,
      );

      /*
       * Si no existe una selección válida,
       * buscamos el default disponible.
       */

      if (!selectedOption) {
        selectedOption = availableOptions.find((option) => option.isDefault);
      }

      /*
       * Como último recurso usamos la primera
       * opción disponible.
       */

      if (!selectedOption) {
        selectedOption = availableOptions[0];
      }

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
    }

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

      /*
       * Si ya existe el mismo producto con las
       * mismas personalizaciones, aumentamos cantidad.
       */

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

      /*
       * Producto nuevo en el carrito.
       */

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

  /* =========================================================
     ELIMINAR PRODUCTO DEL CARRITO
  ========================================================= */

  const removeFromCart = (cartItemId: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== cartItemId),
    );
  };

  /* =========================================================
     AUMENTAR CANTIDAD
  ========================================================= */

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

  /* =========================================================
     DISMINUIR CANTIDAD
  ========================================================= */

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

  /* =========================================================
     LIMPIAR CARRITO
  ========================================================= */

  const clearCart = () => {
    setCartItems([]);
  };

  /* =========================================================
     CREAR PEDIDO
  ========================================================= */

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

    /*
     * Validación final del carrito.
     *
     * Esto evita enviar productos u opciones
     * que hayan quedado agotados.
     */

    for (const cartItem of cartItems) {
      if (cartItem.product.available === false) {
        showAlert(
          "Producto no disponible",
          `${cartItem.product.name} ya no está disponible. Retíralo del carrito antes de continuar.`,
        );

        return null;
      }

      for (const customization of cartItem.customizations) {
        const spec = cartItem.product.specs?.find(
          (currentSpec) => currentSpec.id === customization.specId,
        );

        if (!spec) {
          continue;
        }

        const option = spec.options?.find(
          (currentOption) => currentOption.id === customization.optionId,
        );

        if (!option || option.available === false) {
          showAlert(
            "Opción no disponible",
            `La opción "${customization.optionLabel}" de ${cartItem.product.name} ya no está disponible. Revisa tu carrito.`,
          );

          return null;
        }
      }
    }

    try {
      /*
       * En web NO intentamos registrar push antes
       * de enviar el pedido.
       *
       * Esto evita que el botón se quede en
       * "Enviando..." esperando permisos o APIs
       * de notificaciones que no funcionan igual
       * en navegador.
       */

      let currentPushToken = Platform.OS === "web" ? null : pushToken;

      /*
       * En móvil, si todavía no tenemos token,
       * intentamos obtenerlo.
       *
       * Si falla, el pedido continúa igualmente.
       */

      if (Platform.OS !== "web" && !currentPushToken) {
        try {
          currentPushToken = await registerForPushNotificationsAsync();

          if (currentPushToken) {
            setPushToken(currentPushToken);
          }
        } catch (notificationError) {
          console.error("No se pudo obtener el token push:", notificationError);
        }
      }

      /*
       * EL PEDIDO SE ENVÍA AL SERVIDOR.
       */

      const backendOrder = await apiCreateOrder({
        items: cartItems,
        total: totalPrice,
        studentName: studentName.trim(),
        pushToken: currentPushToken ?? undefined,
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

  /* =========================================================
     ACTUALIZAR PEDIDOS
  ========================================================= */

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
         * en Firestore, lo conservamos.
         */

        if (!backendOrder) {
          return order;
        }

        /*
         * Sincronizamos los datos importantes.
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

  /* =========================================================
     TOTALES DEL CARRITO
  ========================================================= */

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

  /* =========================================================
     CONTEXTO
  ========================================================= */

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
