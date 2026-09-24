import { File as ExpoFile } from "expo-file-system";
import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("EXPO_PUBLIC_API_URL no está configurada.");
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL no está configurada.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? `Error HTTP ${response.status}`);
  }

  return data as T;
};

/* =========================================================
   PRODUCTOS
========================================================= */

export const getMenu = () =>
  request<import("../types/menu").MenuItem[]>("/menu");

export const createMenuItem = (item: import("../types/menu").MenuItemDraft) =>
  request<import("../types/menu").MenuItem>("/menu", {
    method: "POST",
    body: JSON.stringify(item),
  });

export const updateMenuItem = (
  id: string,
  item: import("../types/menu").MenuItemDraft,
) =>
  request<import("../types/menu").MenuItem>(`/menu/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });

export const deleteMenuItem = (id: string) =>
  request<{ id: string }>(`/menu/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const toggleItemAvailability = (id: string, available: boolean) =>
  request<import("../types/menu").MenuItem>(`/menu/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ available }),
  });

/* =========================================================
   ESTADO DE LA CAFETERÍA
========================================================= */

export type StoreStatus = {
  isOpen: boolean;
  updatedAt?: string;
};

export const getStoreStatus = () => request<StoreStatus>("/store-status");

export const updateStoreStatus = (isOpen: boolean) =>
  request<StoreStatus>("/store-status", {
    method: "PUT",
    body: JSON.stringify({ isOpen }),
  });

/* =========================================================
   ÓRDENES
========================================================= */

export type OrderStatus =
  | "pendiente"
  | "preparando"
  | "listo"
  | "entregado"
  | "cancelado";

export type BackendOrder = {
  id: string;

  /**
   * Número visible del pedido.
   *
   * Los pedidos nuevos siempre tendrán número.
   * Los pedidos antiguos creados antes de implementar
   * authCode pueden no tenerlo.
   */
  authCode?: number;

  items: any[];

  total: number;

  studentName: string;

  status: OrderStatus;

  createdAt: string;

  updatedAt: string;

  /**
   * Identificador persistente de la instalación/dispositivo
   * que creó el pedido.
   */
  clientId?: string;

  /**
   * Token del dispositivo que creó el pedido.
   */
  pushToken?: string;

  /**
   * Información de cancelación.
   */
  cancellationReason?: string;

  cancelledAt?: string;

  /**
   * Mensaje adicional para mostrar al cliente.
   */
  notice?: string;
};

/**
 * Crear una orden.
 *
 * clientId identifica al dispositivo/instalación que creó
 * el pedido y permite recuperar únicamente sus pedidos.
 */
export const createOrder = async (orderData: {
  items: any[];

  total: number;

  studentName: string;

  clientId: string;

  /**
   * Token push del dispositivo del cliente.
   */
  pushToken?: string;
}) =>
  request<BackendOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

/**
 * Todas las órdenes.
 *
 * Utilizado por el administrador.
 */
export const getOrders = () => request<BackendOrder[]>("/orders");

/**
 * Órdenes pertenecientes a un cliente/dispositivo.
 *
 * Utilizado por la vista del cliente.
 */
export const getOrdersByClientId = (clientId: string) =>
  request<BackendOrder[]>(`/orders/client/${encodeURIComponent(clientId)}`);

/**
 * Una sola orden.
 */
export const getOrderById = (id: string) =>
  request<BackendOrder>(`/orders/${encodeURIComponent(id)}`);

/**
 * Cambiar estado de una orden.
 *
 * Utilizado por el administrador.
 */
export const updateOrderStatus = (id: string, status: OrderStatus) =>
  request<BackendOrder>(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

/**
 * Cancelar una orden desde el cliente.
 *
 * El backend debe verificar:
 * 1. Que el clientId sea dueño de la orden.
 * 2. Que la orden esté en pendiente o preparando.
 */
export const cancelOrder = (id: string, clientId: string) =>
  request<BackendOrder>(`/orders/${encodeURIComponent(id)}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ clientId }),
  });

/**
 * Eliminar un producto de una orden.
 *
 * El backend recalcula automáticamente
 * el total de la orden.
 *
 * Si era el último producto, el backend
 * cancela automáticamente la orden y
 * guarda el motivo de cancelación.
 */
export const removeOrderItem = (orderId: string, itemId: string) =>
  request<BackendOrder>(`/orders/${encodeURIComponent(orderId)}/items/remove`, {
    method: "PATCH",
    body: JSON.stringify({ itemId }),
  });

/* =========================================================
   IMÁGENES DE PRODUCTOS
========================================================= */

export async function uploadImage(imageUri: string) {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL no está configurada.");
  }

  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(imageUri);

    if (!response.ok) {
      throw new Error("No se pudo leer la imagen seleccionada");
    }

    const blob = await response.blob();

    const file = new globalThis.File([blob], "product-image.jpg", {
      type: blob.type || "image/jpeg",
    });

    formData.append("image", file);
  } else {
    const file = new ExpoFile(imageUri);

    formData.append("image", file as any);
  }

  const response = await fetch(`${API_URL}/upload-image`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ?? `Error HTTP ${response.status} al subir la imagen`,
    );
  }

  return data as {
    url: string;
    publicId: string;
  };
}

/* =========================================================
   PROMOCIONES
========================================================= */

export type Promotion = {
  id: string;

  imageUrl: string;

  publicId: string | null;

  updatedAt?: string;
};

export const getPromotion = () => request<Promotion | null>("/promotions");

/* =========================================================
   SUBIR IMAGEN DE PROMOCIÓN
========================================================= */

export async function uploadPromoImage(imageUri: string) {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL no está configurada.");
  }

  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(imageUri);

    if (!response.ok) {
      throw new Error("No se pudo leer la imagen de promoción seleccionada");
    }

    const blob = await response.blob();

    const file = new globalThis.File([blob], "promo-image.jpg", {
      type: blob.type || "image/jpeg",
    });

    formData.append("image", file);
  } else {
    const file = new ExpoFile(imageUri);

    formData.append("image", file as any);
  }

  const response = await fetch(`${API_URL}/upload-promo-image`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ??
        `Error HTTP ${response.status} al subir la imagen de promoción`,
    );
  }

  return data as {
    url: string;
    publicId: string;
  };
}

/* =========================================================
   GUARDAR PROMOCIÓN
========================================================= */

export const savePromotion = (data: {
  imageUrl: string;
  publicId: string | null;
}) =>
  request<Promotion>("/promotions", {
    method: "PUT",
    body: JSON.stringify(data),
  });

/* =========================================================
   ELIMINAR PROMOCIÓN
========================================================= */

export const deletePromotion = () =>
  request<{ message: string }>("/promotions", {
    method: "DELETE",
  });
