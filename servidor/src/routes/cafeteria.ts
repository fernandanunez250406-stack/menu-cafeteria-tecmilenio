import { Request, Response, Router } from "express";
import { db } from "../config/firebase.js";

const router = Router();

const menuCollection = db.collection("menu");

/**
 * Convierte documentos antiguos y nuevos de Firebase
 * al formato que utiliza actualmente la aplicación.
 */
const normalizeMenuItem = (data: any) => {
  return {
    categoryId: String(
      data.categoryId ?? data.categoría ?? data.category ?? "",
    ).trim(),

    name: String(data.name ?? data.producto ?? "").trim(),

    price: Number(data.price ?? data.precio),

    emoji: String(data.emoji ?? "🍽️"),

    photoUri: data.photoUri ?? null,

    description: String(data.description ?? "").trim(),

    specs: Array.isArray(data.specs)
      ? data.specs
          .filter(
            (spec: any) =>
              spec &&
              String(spec.label ?? "").trim() &&
              String(spec.value ?? "").trim(),
          )
          .map((spec: any) => ({
            label: String(spec.label).trim(),
            value: String(spec.value).trim(),
          }))
      : [],

    available: data.available !== false,
  };
};

/**
 * Limpia y prepara los datos enviados por la aplicación.
 */
const cleanMenuItem = (body: any) => ({
  categoryId: String(body.categoryId ?? "").trim(),

  name: String(body.name ?? "").trim(),

  price: Number(body.price),

  emoji: String(body.emoji ?? "🍽️"),

  photoUri: body.photoUri ?? null,

  description: String(body.description ?? "").trim(),

  specs: Array.isArray(body.specs)
    ? body.specs
        .filter(
          (spec: any) =>
            spec &&
            String(spec.label ?? "").trim() &&
            String(spec.value ?? "").trim(),
        )
        .map((spec: any) => ({
          label: String(spec.label).trim(),
          value: String(spec.value).trim(),
        }))
    : [],

  available: body.available !== false,
});

/**
 * Valida los datos de un producto.
 */
const validateMenuItem = (item: any) => {
  if (!item.name) {
    return "El nombre del producto es obligatorio";
  }

  if (!Number.isFinite(item.price) || item.price < 0) {
    return "El precio no es válido";
  }

  if (!item.categoryId) {
    return "La categoría es obligatoria";
  }

  return null;
};

/**
 * GET /api/menu
 * Obtiene todos los productos de Firebase.
 *
 * También convierte automáticamente productos antiguos
 * que utilizan producto/precio/categoría.
 */
router.get("/menu", async (_req: Request, res: Response) => {
  try {
    const snapshot = await menuCollection.get();

    const menu = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...normalizeMenuItem(doc.data()),
    }));

    res.json(menu);
  } catch (error) {
    console.error("GET /menu", error);
    res.status(500).json({
      error: "Error al obtener el menú",
    });
  }
});

/**
 * POST /api/menu
 * Crea un producto nuevo en Firebase.
 */
router.post("/menu", async (req: Request, res: Response) => {
  try {
    const item = cleanMenuItem(req.body);

    const validationError = validateMenuItem(item);

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    const now = new Date().toISOString();

    const docRef = await menuCollection.add({
      ...item,
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({
      id: docRef.id,
      ...item,
    });
  } catch (error) {
    console.error("POST /menu", error);

    res.status(500).json({
      error: "Error al guardar el producto",
    });
  }
});

/**
 * PUT /api/menu/:id
 * Actualiza un producto existente.
 */
router.put("/menu/:id", async (req: Request, res: Response) => {
  try {
    const ref = menuCollection.doc(String(req.params.id));

    const current = await ref.get();

    if (!current.exists) {
      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }

    const body = req.body ?? {};
    const currentData = current.data() ?? {};

    /*
     * Primero normalizamos el documento existente.
     * Esto permite editar también productos antiguos.
     */
    const normalizedCurrent = normalizeMenuItem(currentData);

    const merged = cleanMenuItem({
      ...normalizedCurrent,
      ...body,
    });

    const validationError = validateMenuItem(merged);

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    await ref.update({
      ...merged,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      id: ref.id,
      ...merged,
    });
  } catch (error) {
    console.error(`PUT /menu/${req.params.id}`, error);

    res.status(500).json({
      error: "Error al actualizar el producto",
    });
  }
});

/**
 * DELETE /api/menu/:id
 * Elimina un producto de Firebase.
 */
router.delete("/menu/:id", async (req: Request, res: Response) => {
  try {
    const ref = menuCollection.doc(String(req.params.id));

    const current = await ref.get();

    if (!current.exists) {
      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }

    await ref.delete();

    res.json({
      id: ref.id,
    });
  } catch (error) {
    console.error(`DELETE /menu/${req.params.id}`, error);

    res.status(500).json({
      error: "Error al eliminar el producto",
    });
  }
});

/**
 * POST /api/orders
 * Crea una orden en Firebase.
 */
router.post("/orders", async (req: Request, res: Response) => {
  try {
    const { items, total, studentName } = req.body;

    const authCode = Math.floor(1000 + Math.random() * 9000).toString();

    const newOrder = {
      items,
      total,
      studentName,
      authCode,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("orders").add(newOrder);

    res.status(201).json({
      id: docRef.id,
      ...newOrder,
    });
  } catch (error) {
    console.error("POST /orders", error);

    res.status(500).json({
      error: "Error al crear la orden",
    });
  }
});

export default router;
