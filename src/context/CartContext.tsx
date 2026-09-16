import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import { Alert } from "react-native";

import { MenuItem } from "../types/menu";

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
  status: string;
  createdAt: string;
  authCode: string;
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
  createLocalOrder: () => Order | null;

  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined,
);

const MAX_QUANTITY = 3;

const createCartItemId = () =>
  `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createOrderId = () =>
  `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createCustomizationKey = (
  customizations: SelectedCustomization[],
) => {
  return customizations
    .map(
      (customization) =>
        `${customization.specId}:${customization.optionId}`,
    )
    .sort()
    .join("|");
};

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const addToCart = (
    product: MenuItem,
    selectedOptions: Record<string, string> = {},
  ) => {
    const customizations: SelectedCustomization[] = [];

    const specs = Array.isArray(product.specs)
      ? product.specs
      : [];

    specs.forEach((spec) => {
      if (!spec || !Array.isArray(spec.options)) {
        return;
      }

      const selectedOptionId = selectedOptions[spec.id];

      const selectedOption =
        spec.options.find(
          (option) => option.id === selectedOptionId,
        ) ??
        spec.options.find(
          (option) => option.isDefault,
        ) ??
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
          Number.isFinite(selectedOption.price) &&
          selectedOption.price >= 0
            ? selectedOption.price
            : 0,
      });
    });

    const customizationPrice = customizations.reduce(
      (total, customization) =>
        total + customization.price,
      0,
    );

    const unitPrice =
      product.price + customizationPrice;

    const newCustomizationKey =
      createCustomizationKey(customizations);

    setCartItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(
        (item) => {
          if (item.product.id !== product.id) {
            return false;
          }

          const existingKey =
            createCustomizationKey(
              item.customizations,
            );

          return existingKey === newCustomizationKey;
        },
      );

      if (existingItemIndex !== -1) {
        const existingItem =
          currentItems[existingItemIndex];

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
      currentItems.filter(
        (item) => item.id !== cartItemId,
      ),
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

  const createLocalOrder = (): Order | null => {
    if (cartItems.length === 0) {
      Alert.alert(
        "Carrito vacío",
        "Agrega productos antes de realizar el pedido.",
      );

      return null;
    }

    const order: Order = {
      id: createOrderId(),
      items: cartItems,
      total: totalPrice,
      status: "pendiente",
      createdAt: new Date().toISOString(),
      authCode: Math.floor(
        1000 + Math.random() * 9000,
      ).toString(),
    };

    setOrders((currentOrders) => [
      order,
      ...currentOrders,
    ]);

    setCartItems([]);

    return order;
  };

  const totalItems = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
    [cartItems],
  );

  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + item.unitPrice * item.quantity,
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
    createLocalOrder,
    totalItems,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart debe utilizarse dentro de CartProvider",
    );
  }

  return context;
}