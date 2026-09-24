import { Request, Response, Router } from "express";

import cloudinary from "../config/cloudinary.js";
import { db } from "../config/firebase.js";
import upload from "../middleware/upload.js";

const router = Router();

/* =========================================================
   NOTIFICACIONES PUSH
========================================================= */

type NotificationStatus =
  | "pendiente"
  | "preparando"
  | "listo"
  | "entregado"
  | "cancelado";

const sendPushNotification = async (
  pushToken: string | undefined,
  status: NotificationStatus,
  orderNumber: number | undefined,
) => {
  if (!pushToken || !pushToken.trim()) {
    return;
  }

  const messages: Record<
    NotificationStatus,
    {
      title: string;
      body: string;
    }
  > = {
    pendiente: {
      title: "Pedido recibido",
      body: `Tu pedido #${orderNumber ?? "—"} fue recibido correctamente.`,
    },
    preparando: {
      title: "Tu pedido está en preparación",
      body: `El pedido #${orderNumber ?? "—"} ya está siendo preparado.`,
    },
    listo: {
      title: "Tu pedido está listo",
      body: `El pedido #${orderNumber ?? "—"} está listo para recoger.`,
    },
    entregado: {
      title: "Pedido entregado",
      body: `El pedido #${orderNumber ?? "—"} fue marcado como entregado.`,
    },
    cancelado: {
      title: "Pedido cancelado",
      body: `El pedido #${orderNumber ?? "—"} fue cancelado.`,
    },
  };

  const notification = messages[status];

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken.trim(),
        sound: "default",
        title: notification.title,
        body: notification.body,
        data: {
          type: "order-status",
          status,
          orderNumber: orderNumber ?? null,
        },
        channelId: "orders",
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Error enviando notificación push:", data);
      return;
    }

    console.log(
      `Notificación enviada para el pedido #${orderNumber ?? "—"}:`,
      status,
    );
  } catch (error) {
    console.error("Error enviando notificación push:", error);
  }
};

/* =========================================================
   ESTADO DE LA CAFETERÍA
========================================================= */

router.get("/store-status", async (_req: Request, res: Response) => {
  try {
    const storeRef = db.collection("cafeteria").doc("settings");
    const snapshot = await storeRef.get();

    if (!snapshot.exists) {
      const now = new Date().toISOString();

      const defaultStatus = {
        isOpen: true,
        updatedAt: now,
      };

      await storeRef.set(defaultStatus);

      return res.status(200).json(defaultStatus);
    }

    const data = snapshot.data() ?? {};

    return res.status(200).json({
      isOpen: typeof data.isOpen === "boolean" ? data.isOpen : true,
      updatedAt:
        typeof data.updatedAt === "string" ? data.updatedAt : undefined,
    });
  } catch (error) {
    console.error("Error obteniendo estado de la cafetería:", error);

    return res.status(500).json({
      error: "No se pudo obtener el estado de la cafetería",
    });
  }
});

router.put("/store-status", async (req: Request, res: Response) => {
  try {
    const { isOpen } = req.body;

    if (typeof isOpen !== "boolean") {
      return res.status(400).json({
        error: "El estado de la cafetería debe ser booleano",
      });
    }

    const now = new Date().toISOString();

    const storeStatus = {
      isOpen,
      updatedAt: now,
    };

    const storeRef = db.collection("cafeteria").doc("settings");

    await storeRef.set(storeStatus, {
      merge: true,
    });

    return res.status(200).json(storeStatus);
  } catch (error) {
    console.error("Error actualizando estado de la cafetería:", error);

    return res.status(500).json({
      error: "No se pudo actualizar el estado de la cafetería",
    });
  }
});

/* =========================================================
   PRODUCTOS - OBTENER MENÚ
========================================================= */

router.get("/menu", async (_req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection("menu")
      .orderBy("createdAt", "desc")
      .get();

    const menu = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(menu);
  } catch (error) {
    console.error("Error obteniendo menú:", error);

    return res.status(500).json({
      error: "No se pudo obtener el menú",
    });
  }
});

/* =========================================================
   PRODUCTOS - CREAR
========================================================= */

router.post("/menu", async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      name,
      price,
      emoji,
      photoUri,
      description,
      specs,
      available,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        error: "El producto necesita nombre y precio",
      });
    }

    const now = new Date().toISOString();

    const product = {
      categoryId: categoryId ?? "",
      name,
      price: Number(price),
      emoji: emoji ?? "☕",
      photoUri: photoUri ?? "",
      description: description ?? "",
      specs: specs ?? [],
      available: available ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("menu").add(product);

    return res.status(201).json({
      id: docRef.id,
      ...product,
    });
  } catch (error) {
    console.error("Error creando producto:", error);

    return res.status(500).json({
      error: "No se pudo crear el producto",
    });
  }
});

/* =========================================================
   PRODUCTOS - ACTUALIZAR
========================================================= */

router.put("/menu/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        error: "Falta el ID del producto",
      });
    }

    const productRef = db.collection("menu").doc(id);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }

    const existingData = productSnapshot.data() ?? {};

    const updatedData = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const finalData = {
      ...existingData,
      ...updatedData,
    };

    await productRef.update(finalData);

    return res.status(200).json({
      id,
      ...finalData,
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);

    return res.status(500).json({
      error: "No se pudo actualizar el producto",
    });
  }
});

/* =========================================================
   PRODUCTOS - ELIMINAR
========================================================= */

router.delete("/menu/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        error: "Falta el ID del producto",
      });
    }

    const productRef = db.collection("menu").doc(id);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }

    await productRef.delete();

    return res.status(200).json({
      id,
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando producto:", error);

    return res.status(500).json({
      error: "No se pudo eliminar el producto",
    });
  }
});

/* =========================================================
   PRODUCTOS - SUBIR IMAGEN
========================================================= */

router.post(
  "/upload-image",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No se recibió ninguna imagen",
        });
      }

      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "cafeteria-tecmilenio/products",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        stream.end(req.file!.buffer);
      });

      return res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Error subiendo imagen de producto:", error);

      return res.status(500).json({
        error: "No se pudo subir la imagen",
      });
    }
  },
);

/* =========================================================
   ÓRDENES - GENERAR NÚMERO ÚNICO
========================================================= */

const generateOrderNumber = async (): Promise<number> => {
  const counterRef = db.collection("counters").doc("orders");

  return db.runTransaction(async (transaction) => {
    const counterSnapshot = await transaction.get(counterRef);

    const currentNumber = counterSnapshot.exists
      ? Number(counterSnapshot.data()?.lastOrderNumber ?? 1000)
      : 1000;

    const nextNumber = currentNumber + 1;

    transaction.set(
      counterRef,
      {
        lastOrderNumber: nextNumber,
        updatedAt: new Date().toISOString(),
      },
      {
        merge: true,
      },
    );

    return nextNumber;
  });
};

/* =========================================================
   ÓRDENES - CREAR
========================================================= */

router.post("/orders", async (req: Request, res: Response) => {
  try {
    const { items, total, studentName, clientId, pushToken } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "La orden debe contener productos",
      });
    }

    if (total === undefined || total === null) {
      return res.status(400).json({
        error: "La orden necesita un total",
      });
    }

    if (
      !studentName ||
      typeof studentName !== "string" ||
      !studentName.trim()
    ) {
      return res.status(400).json({
        error: "La orden necesita el nombre del alumno",
      });
    }

    if (!clientId || typeof clientId !== "string" || !clientId.trim()) {
      return res.status(400).json({
        error: "La orden necesita un identificador de cliente",
      });
    }

    const storeRef = db.collection("cafeteria").doc("settings");
    const storeSnapshot = await storeRef.get();

    if (storeSnapshot.exists) {
      const storeData = storeSnapshot.data() ?? {};

      if (storeData.isOpen === false) {
        return res.status(403).json({
          error:
            "La cafetería está cerrada y no acepta pedidos en este momento.",
        });
      }
    }

    const now = new Date().toISOString();
    const authCode = await generateOrderNumber();

    const order = {
      authCode,
      clientId: clientId.trim(),
      items,
      total: Number(total),
      studentName: studentName.trim(),
      status: "pendiente" as const,
      createdAt: now,
      updatedAt: now,

      ...(typeof pushToken === "string" && pushToken.trim()
        ? {
            pushToken: pushToken.trim(),
          }
        : {}),
    };

    const docRef = await db.collection("orders").add(order);

    if (typeof pushToken === "string" && pushToken.trim()) {
      void sendPushNotification(pushToken, "pendiente", authCode);
    }

    return res.status(201).json({
      id: docRef.id,
      ...order,
    });
  } catch (error) {
    console.error("Error creando orden:", error);

    return res.status(500).json({
      error: "No se pudo crear la orden",
    });
  }
});

/* =========================================================
   ÓRDENES - OBTENER TODAS
   Utilizado por el administrador.
========================================================= */

router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection("orders")
      .orderBy("createdAt", "desc")
      .get();

    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error obteniendo órdenes:", error);

    return res.status(500).json({
      error: "No se pudieron obtener las órdenes",
    });
  }
});

/* =========================================================
   ÓRDENES - OBTENER POR CLIENTE
   Utilizado por los clientes.
========================================================= */

router.get("/orders/client/:clientId", async (req: Request, res: Response) => {
  try {
    const clientId = req.params.clientId as string;

    if (!clientId || !clientId.trim()) {
      return res.status(400).json({
        error: "Falta el identificador del cliente",
      });
    }

    const snapshot = await db
      .collection("orders")
      .where("clientId", "==", clientId.trim())
      .get();

    const orders = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort(
        (a: any, b: any) =>
          new Date(String(b.createdAt ?? "")).getTime() -
          new Date(String(a.createdAt ?? "")).getTime(),
      );

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error obteniendo órdenes del cliente:", error);

    return res.status(500).json({
      error: "No se pudieron obtener los pedidos del cliente",
    });
  }
});

/* =========================================================
   ÓRDENES - CANCELAR DESDE EL CLIENTE

   El cliente SOLAMENTE puede cancelar:
   - pendiente

   No puede cancelar:
   - preparando
   - listo
   - entregado
   - cancelado

   Además, solamente puede cancelar pedidos
   que pertenezcan a su propio clientId.
========================================================= */

router.patch("/orders/:id/cancel", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { clientId } = req.body;

    if (!id) {
      return res.status(400).json({
        error: "Falta el ID de la orden",
      });
    }

    if (!clientId || typeof clientId !== "string" || !clientId.trim()) {
      return res.status(400).json({
        error: "Falta el identificador del cliente",
      });
    }

    const orderRef = db.collection("orders").doc(id);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      return res.status(404).json({
        error: "Orden no encontrada",
      });
    }

    const orderData = orderSnapshot.data() ?? {};

    /* =====================================================
         SEGURIDAD:
         El pedido debe pertenecer al cliente que intenta
         cancelarlo.
      ===================================================== */

    if (
      typeof orderData.clientId !== "string" ||
      orderData.clientId !== clientId.trim()
    ) {
      return res.status(403).json({
        error: "No tienes permiso para cancelar esta orden",
      });
    }

    const currentStatus = orderData.status;

    /* =====================================================
         REGLA DE CANCELACIÓN:

         SOLO se puede cancelar cuando está pendiente.

         Si ya está preparando, listo, entregado o cancelado,
         el servidor rechaza la cancelación.
      ===================================================== */

    if (currentStatus !== "pendiente") {
      return res.status(409).json({
        error:
          "Este pedido ya no puede cancelarse porque comenzó su preparación.",
      });
    }

    const updatedAt = new Date().toISOString();
    const cancelledAt = updatedAt;

    const cancellationReason = "Pedido cancelado por el cliente.";

    await orderRef.update({
      status: "cancelado",
      cancellationReason,
      cancelledAt,
      updatedAt,
    });

    const pushToken =
      typeof orderData.pushToken === "string" ? orderData.pushToken : undefined;

    const authCode =
      typeof orderData.authCode === "number" ? orderData.authCode : undefined;

    void sendPushNotification(pushToken, "cancelado", authCode);

    return res.status(200).json({
      id,
      ...orderData,
      status: "cancelado",
      cancellationReason,
      cancelledAt,
      updatedAt,
    });
  } catch (error) {
    console.error("Error cancelando orden desde el cliente:", error);

    return res.status(500).json({
      error: "No se pudo cancelar la orden",
    });
  }
});

/* =========================================================
   ÓRDENES - OBTENER UNA
========================================================= */

router.get("/orders/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const orderSnapshot = await db.collection("orders").doc(id).get();

    if (!orderSnapshot.exists) {
      return res.status(404).json({
        error: "Orden no encontrada",
      });
    }

    return res.status(200).json({
      id: orderSnapshot.id,
      ...orderSnapshot.data(),
    });
  } catch (error) {
    console.error("Error obteniendo orden:", error);

    return res.status(500).json({
      error: "No se pudo obtener la orden",
    });
  }
});

/* =========================================================
   ÓRDENES - ESTADOS
========================================================= */

const ORDER_STATUSES = [
  "pendiente",
  "preparando",
  "listo",
  "entregado",
  "cancelado",
] as const;

/* =========================================================
   ÓRDENES - CAMBIAR ESTADO
   Utilizado por el administrador.
========================================================= */

router.patch("/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Estado inválido. Usa uno de: ${ORDER_STATUSES.join(", ")}`,
      });
    }

    const orderRef = db.collection("orders").doc(id);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      return res.status(404).json({
        error: "Orden no encontrada",
      });
    }

    const orderData = orderSnapshot.data() ?? {};
    const previousStatus = orderData.status;

    const updatedAt = new Date().toISOString();

    await orderRef.update({
      status,
      updatedAt,
    });

    if (previousStatus !== status) {
      const pushToken =
        typeof orderData.pushToken === "string"
          ? orderData.pushToken
          : undefined;

      const authCode =
        typeof orderData.authCode === "number" ? orderData.authCode : undefined;

      void sendPushNotification(pushToken, status, authCode);
    }

    return res.status(200).json({
      id,
      ...orderData,
      status,
      updatedAt,
    });
  } catch (error) {
    console.error("Error actualizando estado de la orden:", error);

    return res.status(500).json({
      error: "No se pudo actualizar el estado de la orden",
    });
  }
});

/* =========================================================
   ÓRDENES - ELIMINAR PRODUCTO DE UNA ORDEN
========================================================= */

router.patch(
  "/orders/:id/items/remove",
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { itemId } = req.body;

      if (!id) {
        return res.status(400).json({
          error: "Falta el ID de la orden",
        });
      }

      if (!itemId) {
        return res.status(400).json({
          error: "Falta el ID del producto dentro de la orden",
        });
      }

      const orderRef = db.collection("orders").doc(id);
      const orderSnapshot = await orderRef.get();

      if (!orderSnapshot.exists) {
        return res.status(404).json({
          error: "Orden no encontrada",
        });
      }

      const orderData = orderSnapshot.data() ?? {};

      const currentItems = Array.isArray(orderData.items)
        ? orderData.items
        : [];

      const itemExists = currentItems.some((item: any) => item?.id === itemId);

      if (!itemExists) {
        return res.status(404).json({
          error: "El producto no se encuentra dentro de la orden",
        });
      }

      const updatedItems = currentItems.filter(
        (item: any) => item?.id !== itemId,
      );

      const updatedAt = new Date().toISOString();

      /* =====================================================
         Si era el último producto,
         la orden no se elimina.
      ===================================================== */

      if (updatedItems.length === 0) {
        const cancellationReason =
          "Tu pedido fue cancelado porque el producto solicitado se quedó fuera de stock.";

        const cancelledAt = updatedAt;

        await orderRef.update({
          items: [],
          total: 0,
          status: "cancelado",
          cancellationReason,
          cancelledAt,
          updatedAt,
        });

        const pushToken =
          typeof orderData.pushToken === "string"
            ? orderData.pushToken
            : undefined;

        const authCode =
          typeof orderData.authCode === "number"
            ? orderData.authCode
            : undefined;

        void sendPushNotification(pushToken, "cancelado", authCode);

        return res.status(200).json({
          id,
          ...orderData,
          items: [],
          total: 0,
          status: "cancelado",
          cancellationReason,
          cancelledAt,
          updatedAt,
        });
      }

      /* =====================================================
         Si todavía quedan productos,
         recalculamos el total.
      ===================================================== */

      const newTotal = updatedItems.reduce((sum: number, item: any) => {
        const unitPrice = Number(item?.unitPrice ?? 0);
        const quantity = Number(item?.quantity ?? 0);

        return sum + unitPrice * quantity;
      }, 0);

      const finalTotal = Number(newTotal.toFixed(2));

      await orderRef.update({
        items: updatedItems,
        total: finalTotal,
        updatedAt,
      });

      return res.status(200).json({
        id,
        ...orderData,
        items: updatedItems,
        total: finalTotal,
        status: orderData.status,
        updatedAt,
      });
    } catch (error) {
      console.error("Error eliminando producto de la orden:", error);

      return res.status(500).json({
        error: "No se pudo eliminar el producto de la orden",
      });
    }
  },
);

/* =========================================================
   PROMOCIONES - OBTENER
========================================================= */

router.get("/promotions", async (_req: Request, res: Response) => {
  try {
    const promotionRef = db.collection("promotions").doc("current");

    const snapshot = await promotionRef.get();

    if (!snapshot.exists) {
      return res.status(200).json(null);
    }

    return res.status(200).json({
      id: snapshot.id,
      ...snapshot.data(),
    });
  } catch (error) {
    console.error("Error obteniendo promoción:", error);

    return res.status(500).json({
      error: "No se pudo obtener la promoción",
    });
  }
});

/* =========================================================
   PROMOCIONES - SUBIR IMAGEN
========================================================= */

router.post(
  "/upload-promo-image",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No se recibió ninguna imagen",
        });
      }

      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "cafeteria-tecmilenio/promotions",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        stream.end(req.file!.buffer);
      });

      return res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Error subiendo imagen de promoción:", error);

      return res.status(500).json({
        error: "No se pudo subir la imagen de promoción",
      });
    }
  },
);

/* =========================================================
   PROMOCIONES - GUARDAR / ACTUALIZAR
========================================================= */

router.put("/promotions", async (req: Request, res: Response) => {
  try {
    const { imageUrl, publicId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        error: "La promoción necesita una imagen",
      });
    }

    const promotionRef = db.collection("promotions").doc("current");

    const previousSnapshot = await promotionRef.get();

    const previousData = previousSnapshot.exists
      ? previousSnapshot.data()
      : null;

    const promotion = {
      imageUrl,
      publicId: publicId ?? null,
      updatedAt: new Date().toISOString(),
    };

    await promotionRef.set(promotion);

    if (previousData?.publicId && previousData.publicId !== publicId) {
      try {
        await cloudinary.uploader.destroy(previousData.publicId, {
          resource_type: "image",
        });
      } catch (cloudinaryError) {
        console.error(
          "Error eliminando imagen anterior de Cloudinary:",
          cloudinaryError,
        );
      }
    }

    return res.status(200).json({
      id: "current",
      ...promotion,
    });
  } catch (error) {
    console.error("Error guardando promoción:", error);

    return res.status(500).json({
      error: "No se pudo guardar la promoción",
    });
  }
});

/* =========================================================
   PROMOCIONES - ELIMINAR
========================================================= */

router.delete("/promotions", async (_req: Request, res: Response) => {
  try {
    const promotionRef = db.collection("promotions").doc("current");

    const promotionSnapshot = await promotionRef.get();

    if (!promotionSnapshot.exists) {
      return res.status(200).json({
        message: "No había ninguna promoción para eliminar",
      });
    }

    const promotionData = promotionSnapshot.data();

    await promotionRef.delete();

    if (promotionData?.publicId) {
      try {
        await cloudinary.uploader.destroy(promotionData.publicId, {
          resource_type: "image",
        });
      } catch (cloudinaryError) {
        console.error(
          "Error eliminando imagen anterior de Cloudinary:",
          cloudinaryError,
        );
      }
    }

    return res.status(200).json({
      message: "Promoción eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando promoción:", error);

    return res.status(500).json({
      error: "No se pudo eliminar la promoción",
    });
  }
});

export default router;
