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
  cancelOrder as apiCancelOrder,
  createOrder as apiCreateOrder,
  getOrdersByClientId,
  OrderStatus,
} from "../services/api";

import { registerForPushNotificationsAsync } from "../services/notifications";

import { showAlert } from "../utils/crossPlatformConfirm";

const ORDERS_STORAGE_KEY = "@cafeteria/orders";
const CLIENT_ID_STORAGE_KEY = "@cafeteria/client_id";

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

  cancelOrder: (orderId: string) => Promise<boolean>;

  totalItems: number;

  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const MAX_QUANTITY = 3;

const createCartItemId = () =>
  `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createClientId = () =>
  `client-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 14)}-${Math.random().toString(36).slice(2, 14)}`;

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
  const [clientId, setClientId] = useState<string | null>(null);

  const ordersRef = useRef<Order[]>(orders);
  const clientIdRef = useRef<string | null>(null);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // =========================================================
  // IDENTIFICADOR PERSISTENTE DEL CLIENTE
  // =========================================================

  useEffect(() => {
    const loadClientId = async () => {
      try {
        const storedClientId = await AsyncStorage.getItem(
          CLIENT_ID_STORAGE_KEY,
        );

        if (storedClientId?.trim()) {
          clientIdRef.current = storedClientId;
          setClientId(storedClientId);
          return;
        }

        const newClientId = createClientId();

        await AsyncStorage.setItem(CLIENT_ID_STORAGE_KEY, newClientId);

        clientIdRef.current = newClientId;
        setClientId(newClientId);
      } catch (error) {
        console.error("Error recuperando identificador del cliente:", error);

        // Si AsyncStorage falla, usamos un identificador temporal
        // para que la aplicación pueda continuar.
        const temporaryClientId = createClientId();

        clientIdRef.current = temporaryClientId;
        setClientId(temporaryClientId);
      }
    };

    void loadClientId();
  }, []);

  // =========================================================
  // REGISTRAR NOTIFICACIONES PUSH
  // En web las notificaciones no deben bloquear
  // el flujo de creación del pedido.
  // =========================================================

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

  // =========================================================
  // RECUPERAR PEDIDOS GUARDADOS LOCALMENTE
  // AsyncStorage funciona únicamente como caché.
  // El backend será la fuente de verdad.
  // =========================================================

  useEffect(() => {
    const loadStoredOrders = async () => {
      try {
        const stored = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);

        if (!stored) {
          return;
        }

        const parsedOrders: Order[] = JSON.parse(stored);

        if (!Array.isArray(parsedOrders)) {
          return;
        }

        setOrders(parsedOrders);
        ordersRef.current = parsedOrders;
      } catch (error) {
        console.error("Error cargando pedidos guardados:", error);
      }
    };

    void loadStoredOrders();
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

  // =========================================================
  // AGREGAR PRODUCTO AL CARRITO
  // =========================================================

  const addToCart = (
    product: MenuItem,
    selectedOptions: Record<string, string> = {},
  ) => {
    // Si el producto completo está agotado,
    // nunca debe agregarse al carrito.
    if (product.available === false) {
      showAlert(
        "Producto no disponible",
        `${product.name} no está disponible en este momento.`,
      );
      return;
    }

    const customizations: SelectedCustomization[] = [];

    const specs = Array.isArray(product.specs) ? product.specs : [];

    // Revisamos cada especificación.
    for (const spec of specs) {
      if (!spec || !Array.isArray(spec.options) || spec.options.length === 0) {
        continue;
      }

      // Una opción está disponible si:
      // - available === true
      // - o no tiene el campo available.
      const availableOptions = spec.options.filter(
        (option) => option && option.available !== false,
      );

      // Si ninguna opción está disponible,
      // no podemos completar el producto.
      if (availableOptions.length === 0) {
        showAlert(
          "Opción no disponible",
          `No hay opciones disponibles para "${spec.label}" en ${product.name}.`,
        );
        return;
      }

      const selectedOptionId = selectedOptions[spec.id];

      // Primero intentamos utilizar exactamente
      // la opción seleccionada por el cliente.
      let selectedOption = availableOptions.find(
        (option) => option.id === selectedOptionId,
      );

      // Si no existe una selección válida,
      // buscamos el default disponible.
      if (!selectedOption) {
        selectedOption = availableOptions.find((option) => option.isDefault);
      }

      // Como último recurso usamos la primera
      // opción disponible.
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

      // Si ya existe el mismo producto con las
      // mismas personalizaciones, aumentamos cantidad.
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

      // Producto nuevo en el carrito.
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

  // =========================================================
  // ELIMINAR PRODUCTO DEL CARRITO
  // =========================================================

  const removeFromCart = (cartItemId: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== cartItemId),
    );
  };

  // =========================================================
  // AUMENTAR CANTIDAD
  // =========================================================

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

  // =========================================================
  // DISMINUIR CANTIDAD
  // =========================================================

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

  // =========================================================
  // LIMPIAR CARRITO
  // =========================================================

  const clearCart = () => {
    setCartItems([]);
  };

  // =========================================================
  // CREAR PEDIDO
  // =========================================================

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

    // Validación final del carrito.
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
      // Nos aseguramos de tener clientId antes de enviar el pedido.
      let currentClientId = clientIdRef.current;

      if (!currentClientId) {
        try {
          const storedClientId = await AsyncStorage.getItem(
            CLIENT_ID_STORAGE_KEY,
          );

          if (storedClientId?.trim()) {
            currentClientId = storedClientId;
          } else {
            currentClientId = createClientId();

            await AsyncStorage.setItem(CLIENT_ID_STORAGE_KEY, currentClientId);
          }

          clientIdRef.current = currentClientId;
          setClientId(currentClientId);
        } catch (clientIdError) {
          console.error("Error preparando clientId:", clientIdError);

          showAlert(
            "No se pudo identificar el dispositivo",
            "Cierra y vuelve a abrir la aplicación e intenta nuevamente.",
          );

          return null;
        }
      }

      // En web NO intentamos registrar push antes
      // de enviar el pedido.
      let currentPushToken = Platform.OS === "web" ? null : pushToken;

      // En móvil, si todavía no tenemos token,
      // intentamos obtenerlo.
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

      // EL PEDIDO SE ENVÍA AL SERVIDOR.
      // Incluye clientId para poder recuperar posteriormente
      // únicamente los pedidos de este cliente.
      const backendOrder = await apiCreateOrder({
        items: cartItems,
        total: totalPrice,
        studentName: studentName.trim(),
        clientId: currentClientId,
        pushToken: currentPushToken ?? undefined,
      });

      const order: Order = {
        id: backendOrder.id,

        items: Array.isArray(backendOrder.items)
          ? backendOrder.items
          : cartItems,

        total:
          typeof backendOrder.total === "number"
            ? backendOrder.total
            : totalPrice,

        status: backendOrder.status,

        createdAt: backendOrder.createdAt,

        updatedAt: backendOrder.updatedAt,

        studentName: backendOrder.studentName ?? studentName.trim(),

        authCode: String(backendOrder.authCode ?? ""),

        cancellationReason: backendOrder.cancellationReason,

        cancelledAt: backendOrder.cancelledAt,

        notice: backendOrder.notice,
      };

      const nextOrders = [
        order,

        ...ordersRef.current.filter(
          (existingOrder) => existingOrder.id !== order.id,
        ),
      ];

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

  // =========================================================
  // ACTUALIZAR PEDIDOS
  //
  // IMPORTANTE:
  // Ya no usamos GET /orders.
  //
  // El cliente consulta únicamente:
  // GET /orders/client/:clientId
  // =========================================================

  const refreshOrders = async () => {
    try {
      let currentClientId = clientIdRef.current;

      // Si el clientId todavía no llegó al estado,
      // lo recuperamos directamente de AsyncStorage.
      if (!currentClientId) {
        const storedClientId = await AsyncStorage.getItem(
          CLIENT_ID_STORAGE_KEY,
        );

        if (storedClientId?.trim()) {
          currentClientId = storedClientId;
        } else {
          currentClientId = createClientId();

          await AsyncStorage.setItem(CLIENT_ID_STORAGE_KEY, currentClientId);
        }

        clientIdRef.current = currentClientId;
        setClientId(currentClientId);
      }

      // El backend es la fuente de verdad.
      // Siempre hacemos la consulta aunque orders esté vacío.
      const backendOrders = await getOrdersByClientId(currentClientId);

      const updatedOrders: Order[] = backendOrders.map((backendOrder) => ({
        id: backendOrder.id,

        items: Array.isArray(backendOrder.items) ? backendOrder.items : [],

        total: typeof backendOrder.total === "number" ? backendOrder.total : 0,

        status: backendOrder.status,

        createdAt: backendOrder.createdAt,

        updatedAt: backendOrder.updatedAt,

        authCode: String(backendOrder.authCode ?? ""),

        studentName: backendOrder.studentName ?? "",

        cancellationReason: backendOrder.cancellationReason,

        cancelledAt: backendOrder.cancelledAt,

        notice: backendOrder.notice,
      }));

      setOrders(updatedOrders);
      ordersRef.current = updatedOrders;

      await persistOrders(updatedOrders);
    } catch (error) {
      // Si falla el servidor, conservamos el último
      // estado conocido localmente.
      console.error("Error actualizando pedidos:", error);
    }
  };

  // =========================================================
  // CANCELAR PEDIDO DEL CLIENTE
  //
  // El backend valida:
  // 1. Que el pedido exista.
  // 2. Que pertenezca al clientId.
  // 3. Que esté en pendiente o preparando.
  // =========================================================

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    try {
      let currentClientId = clientIdRef.current;

      // Nos aseguramos de tener el clientId.
      if (!currentClientId) {
        const storedClientId = await AsyncStorage.getItem(
          CLIENT_ID_STORAGE_KEY,
        );

        if (storedClientId?.trim()) {
          currentClientId = storedClientId;
        } else {
          currentClientId = createClientId();

          await AsyncStorage.setItem(CLIENT_ID_STORAGE_KEY, currentClientId);
        }

        clientIdRef.current = currentClientId;
        setClientId(currentClientId);
      }

      // El backend verifica que el pedido pertenezca
      // a este cliente y que todavía pueda cancelarse.
      const backendOrder = await apiCancelOrder(orderId, currentClientId);

      const updatedOrder: Order = {
        id: backendOrder.id,

        items: Array.isArray(backendOrder.items) ? backendOrder.items : [],

        total: typeof backendOrder.total === "number" ? backendOrder.total : 0,

        status: backendOrder.status,

        createdAt: backendOrder.createdAt,

        updatedAt: backendOrder.updatedAt,

        authCode: String(backendOrder.authCode ?? ""),

        studentName: backendOrder.studentName ?? "",

        cancellationReason: backendOrder.cancellationReason,

        cancelledAt: backendOrder.cancelledAt,

        notice: backendOrder.notice,
      };

      const nextOrders = ordersRef.current.map((existingOrder) =>
        existingOrder.id === updatedOrder.id ? updatedOrder : existingOrder,
      );

      setOrders(nextOrders);
      ordersRef.current = nextOrders;

      await persistOrders(nextOrders);

      return true;
    } catch (error) {
      console.error("Error cancelando pedido:", error);

      showAlert(
        "No se pudo cancelar",
        error instanceof Error
          ? error.message
          : "No se pudo cancelar el pedido. Intenta nuevamente.",
      );

      return false;
    }
  };

  // =========================================================
  // TOTALES DEL CARRITO
  // =========================================================

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

  // =========================================================
  // CONTEXTO
  // =========================================================

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

    cancelOrder,

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
