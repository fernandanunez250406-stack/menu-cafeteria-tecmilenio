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

export const createOrder = async (orderData: {
  items: any[];
  total: number;
  studentName: string;
}) => request("/orders", { method: "POST", body: JSON.stringify(orderData) });
