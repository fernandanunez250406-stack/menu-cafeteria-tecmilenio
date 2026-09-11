import { createContext, ReactNode, useContext, useMemo, useState } from "react";
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

type CartContextType = {
  cartItems: CartItem[];

  addToCart: (
    product: MenuItem,
    selectedOptions?: Record<string, string>,
  ) => void;

  removeFromCart: (cartItemId: string) => void;

  increaseQuantity: (cartItemId: string) => void;

  decreaseQuantity: (cartItemId: string) => void;

  clearCart: () => void;

  totalItems: number;

  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const MAX_QUANTITY = 3;

/**
 * Genera un ID único para cada línea del carrito.
 */
const createCartItemId = () =>
  `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Crea una clave basada en las personalizaciones.
 *
 * Ejemplo:
 *
 * Latte + leche entera
 * !=
 * Latte + leche de almendra
 *
 * Esto permite que el mismo producto pueda existir
 * varias veces en el carrito con diferentes opciones.
 */
const createCustomizationKey = (customizations: SelectedCustomization[]) => {
  return customizations
    .map((customization) => `${customization.specId}:${customization.optionId}`)
    .sort()
    .join("|");
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  /**
   * Agrega un producto al carrito.
   *
   * selectedOptions tiene esta estructura:
   *
   * {
   *   "spec-milk-latte": "option-almond-latte"
   * }
   */
  const addToCart = (
    product: MenuItem,
    selectedOptions: Record<string, string> = {},
  ) => {
    /**
     * Construimos las personalizaciones seleccionadas.
     */
    const customizations: SelectedCustomization[] = [];

    const specs = Array.isArray(product.specs) ? product.specs : [];

    specs.forEach((spec) => {
      if (!spec || !Array.isArray(spec.options) || spec.options.length === 0) {
        return;
      }

      /**
       * Si no llega una selección, usamos
       * la opción default.
       */
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

    /**
     * Calculamos el precio final unitario.
     */
    const customizationPrice = customizations.reduce(
      (total, customization) => total + customization.price,
      0,
    );

    const unitPrice = product.price + customizationPrice;

    /**
     * Identificamos si ya existe exactamente
     * la misma combinación de personalizaciones.
     */
    const newCustomizationKey = createCustomizationKey(customizations);

    setCartItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex((item) => {
        if (item.product.id !== product.id) {
          return false;
        }

        const existingKey = createCustomizationKey(item.customizations);

        return existingKey === newCustomizationKey;
      });

      /**
       * Si ya existe la misma combinación,
       * aumentamos su cantidad.
       */
      if (existingItemIndex !== -1) {
        const existingItem = currentItems[existingItemIndex];

        /**
         * Límite máximo por combinación.
         */
        if (existingItem.quantity >= MAX_QUANTITY) {
          console.log("Oops, llegaste a tu limite del producto por ahora.");

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

      /**
       * Si es una combinación nueva,
       * creamos una nueva línea del carrito.
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

  /**
   * Elimina completamente una línea del carrito.
   */
  const removeFromCart = (cartItemId: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== cartItemId),
    );
  };

  /**
   * Aumenta la cantidad de una línea.
   */
  const increaseQuantity = (cartItemId: string) => {
    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== cartItemId) {
          return item;
        }

        if (item.quantity >= MAX_QUANTITY) {
          console.log("Oops, llegaste a tu limite del producto por ahora.");

          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }),
    );
  };

  /**
   * Disminuye la cantidad de una línea.
   *
   * Si llega a 0, se elimina.
   */
  const decreaseQuantity = (cartItemId: string) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== cartItemId) {
            return item;
          }

          return {
            ...item,
            quantity: item.quantity - 1,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  /**
   * Vacía todo el carrito.
   */
  const clearCart = () => {
    setCartItems([]);
  };

  /**
   * Cantidad total de productos.
   */
  const totalItems = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  /**
   * Precio total del carrito.
   *
   * IMPORTANTE:
   * usamos unitPrice, no product.price,
   * porque unitPrice ya incluye personalizaciones.
   */
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
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
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
