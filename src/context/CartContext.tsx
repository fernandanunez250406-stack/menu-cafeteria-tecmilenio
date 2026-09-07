import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { MenuItem } from "../types/menu";

export type CartItem = {
    product: MenuItem;
    quantity: number;
};

type CartContextType ={
    cartItems: CartItem[];
    addToCart: (product: MenuItem) => void;
    removeFromCart: (productId:string) => void;
    increaseQuantity: (productId: string) => void;
    decreaseQuantity: (productId: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode}) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = (product: MenuItem) => {
        if (!product.available) return;

        setCartItems((currentItems) => {
            const existingItem = currentItems.find(
                (item) => item.product.id === product.id,
            );

            if (existingItem) {
                return currentItems.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }

            return [...currentItems, { product, quantity: 1}];
        });
    };

    const increaseQuantity = (productId: string) => {
        setCartItems((currentItems) => 
            currentItems.map((item) =>
                item.product.id ===  productId
                    ? {...item, quantity: item.quantity + 1}
                    : item,
            ),
        );
    };

    const decreaseQuantity = (productId: string) => {
        setCartItems((currentItems) =>
            currentItems
                .map((item) =>
                    item.product.id === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    };

    const removeFromCart = (productId: string) => {
        setCartItems((currentItems) =>
            currentItems.filter((item) => item.product.id !== productId),
        );
    };


    const clearCart = () => {
        setCartItems([]);
    };

    const totalItems = useMemo(
        () =>
            cartItems.reduce((total, item) => total + item.quantity, 0),
        [cartItems],
    );

    const totalPrice = useMemo(
        () =>
            cartItems.reduce(
                (total, item) => total + item.product.price * item.quantity,
                0,
            ),
            [cartItems],
    );

    return(
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                increaseQuantity,
                decreaseQuantity,
                clearCart,
                totalItems,
                totalPrice,
            }}
        >
            {children}
        </CartContext.Provider>    
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart debe usarse dentro de CartProvider");
    }

    return context
}