import { Request, Response, Router } from "express";

import cloudinary from "../config/cloudinary.js";
import { db } from "../config/firebase.js";
import upload from "../middleware/upload.js";

const router = Router();

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

/*
 * Firestore utiliza una transacción para evitar que dos
 * clientes reciban el mismo número de pedido si hacen
 * pedidos prácticamente al mismo tiempo.
 *
 * Primer pedido:
 * 1001
 *
 * Segundo:
 * 1002
 *
 * Tercero:
 * 1003
 */

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
    const { items, total, studentName } = req.body;

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

    const now = new Date().toISOString();

    /*
     * Generamos el número único antes
     * de guardar la orden.
     */
    const authCode = await generateOrderNumber();

    const order = {
      authCode,
      items,
      total: Number(total),
      studentName: studentName.trim(),
      status: "pendiente",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("orders").add(order);

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
   ÓRDENES - CAMBIAR ESTADO
========================================================= */

const ORDER_STATUSES = [
  "pendiente",
  "preparando",
  "listo",
  "entregado",
  "cancelado",
] as const;

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

    const updatedAt = new Date().toISOString();

    await orderRef.update({
      status,
      updatedAt,
    });

    return res.status(200).json({
      id,
      ...orderSnapshot.data(),
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

    /*
     * Eliminamos la imagen anterior
     * de Cloudinary si era diferente.
     */
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

    /*
     * Eliminamos la imagen de Cloudinary.
     *
     * Si Cloudinary falla, la promoción
     * de Firestore ya queda eliminada.
     */
    if (promotionData?.publicId) {
      try {
        await cloudinary.uploader.destroy(promotionData.publicId, {
          resource_type: "image",
        });
      } catch (cloudinaryError) {
        console.error(
          "Error eliminando imagen de Cloudinary:",
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
