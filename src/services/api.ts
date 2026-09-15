import { File as ExpoFile } from "expo-file-system";
import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
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
   ÓRDENES
========================================================= */

export const createOrder = async (orderData: {
  items: any[];
  total: number;
  studentName: string;
}) =>
  request("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

/* =========================================================
   IMÁGENES DE PRODUCTOS
========================================================= */

export async function uploadImage(imageUri: string) {
  const formData = new FormData();

  if (Platform.OS === "web") {
    /*
     * WEB
     * ImagePicker devuelve una URI/blob que convertimos
     * al File nativo del navegador.
     */
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
    /*
     * ANDROID / iOS
     * Se utiliza File de expo-file-system porque
     * FormData necesita un archivo compatible con Expo.
     */
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
  const formData = new FormData();

  if (Platform.OS === "web") {
    /*
     * WEB
     */
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
    /*
     * ANDROID / iOS
     */
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
