const API_URL = "http://192.168.0.67:3000/api";
export const getMenu = async () => {
  try {
    const response = await fetch(`${API_URL}/menu`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener el menú:", error);
    return [];
  }
};

export const createOrder = async (orderData: {
  items: any[];
  total: number;
  studentName: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al crear la orden:", error);
    throw error;
  }
};
