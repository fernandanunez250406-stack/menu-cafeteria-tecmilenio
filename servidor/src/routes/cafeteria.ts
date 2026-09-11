import { Request, Response, Router } from "express";
import { db } from "../config/firebase.js";

const router = Router();

const menuCollection = db.collection("menu");

/**
 * Genera un ID sencillo para especificaciones y opciones.
 */
const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Normaliza una opción individual.
 *
 * Formato actual:
 * {
 *   id: string,
 *   label: string,
 *   price: number,
 *   isDefault?: boolean
 * }
 */
const normalizeOption = (option: any, index: number, specId: string) => {
  if (!option || typeof option !== "object") {
    return null;
  }

  const label = String(option.label ?? "").trim();

  if (!label) {
    return null;
  }

  const rawPrice = Number(option.price);

  const price = Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0;

  return {
    id:
      typeof option.id === "string" && option.id.trim()
        ? option.id.trim()
        : createId(`option-${specId}-${index}`),

    label,

    price,

    isDefault: Boolean(option.isDefault),
  };
};

/**
 * Normaliza una especificación.
 *
 * Soporta:
 *
 * Formato nuevo:
 * {
 *   id,
 *   label,
 *   options: [...]
 * }
 *
 * Formato antiguo:
 * {
 *   label,
 *   value
 * }
 *
 * El formato antiguo se convierte automáticamente
 * en una especificación con una sola opción.
 */
const normalizeSpec = (spec: any, specIndex: number) => {
  if (!spec || typeof spec !== "object") {
    return null;
  }

  const label = String(spec.label ?? "").trim();

  if (!label) {
    return null;
  }

  const specId =
    typeof spec.id === "string" && spec.id.trim()
      ? spec.id.trim()
      : createId(`spec-${specIndex}`);

  /**
   * FORMATO NUEVO
   */
  if (Array.isArray(spec.options)) {
    const options = spec.options
      .map((option: any, optionIndex: number) =>
        normalizeOption(option, optionIndex, specId),
      )
      .filter(
        (
          option: ReturnType<typeof normalizeOption>,
        ): option is NonNullable<ReturnType<typeof normalizeOption>> =>
          option !== null,
      );

    if (options.length === 0) {
      return null;
    }

    /**
     * Garantizamos que exista una opción default.
     *
     * Si ninguna viene marcada como default,
     * la primera será la predeterminada.
     */
    const hasDefault = options.some(
      (option: {
        id: string;
        label: string;
        price: number;
        isDefault: boolean;
      }) => option.isDefault,
    );

    const normalizedOptions = options.map(
      (
        option: {
          id: string;
          label: string;
          price: number;
          isDefault: boolean;
        },
        index: number,
      ) => ({
        ...option,
        isDefault: hasDefault ? option.isDefault : index === 0,
      }),
    );

    return {
      id: specId,
      label,
      options: normalizedOptions,
    };
  }

  /**
   * FORMATO ANTIGUO
   *
   * Antes la aplicación manejaba:
   *
   * {
   *   label: "Tipo de leche",
   *   value: "Leche entera"
   * }
   *
   * Lo convertimos a:
   *
   * {
   *   id: "...",
   *   label: "Tipo de leche",
   *   options: [
   *     {
   *       id: "...",
   *       label: "Leche entera",
   *       price: 0,
   *       isDefault: true
   *     }
   *   ]
   * }
   */
  const oldValue = String(spec.value ?? "").trim();

  if (oldValue) {
    return {
      id: specId,
      label,
      options: [
        {
          id: createId(`option-${specId}`),
          label: oldValue,
          price: 0,
          isDefault: true,
        },
      ],
    };
  }

  return null;
};

/**
 * Normaliza todas las especificaciones de un producto.
 */
const normalizeSpecs = (specs: any) => {
  if (!Array.isArray(specs)) {
    return [];
  }

  return specs
    .map((spec: any, index: number) => normalizeSpec(spec, index))
    .filter(
      (
        spec: ReturnType<typeof normalizeSpec>,
      ): spec is NonNullable<ReturnType<typeof normalizeSpec>> => spec !== null,
    );
};

/**
 * Convierte documentos de Firebase al formato actual
 * que utiliza la aplicación.
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

    specs: normalizeSpecs(data.specs),

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

  specs: normalizeSpecs(body.specs),

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

  /**
   * Validamos las especificaciones.
   */
  if (!Array.isArray(item.specs)) {
    return "Las especificaciones no son válidas";
  }

  for (let specIndex = 0; specIndex < item.specs.length; specIndex++) {
    const spec = item.specs[specIndex];

    if (!spec || !String(spec.label ?? "").trim()) {
      return `La especificación ${specIndex + 1} no tiene nombre`;
    }

    if (!Array.isArray(spec.options) || spec.options.length === 0) {
      return `La especificación "${spec.label}" debe tener al menos una opción`;
    }

    const hasDefault = spec.options.some(
      (option: any) => option.isDefault === true,
    );

    if (!hasDefault) {
      return `La especificación "${spec.label}" debe tener una opción predeterminada`;
    }

    for (
      let optionIndex = 0;
      optionIndex < spec.options.length;
      optionIndex++
    ) {
      const option = spec.options[optionIndex];

      if (!option || !String(option.label ?? "").trim()) {
        return `La opción ${
          optionIndex + 1
        } de "${spec.label}" no tiene nombre`;
      }

      if (!Number.isFinite(option.price) || option.price < 0) {
        return `El precio de "${option.label}" no es válido`;
      }
    }
  }

  return null;
};

/**
 * GET /api/menu
 *
 * Obtiene todos los productos de Firebase.
 *
 * Los productos antiguos se convierten automáticamente
 * al formato nuevo.
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
 *
 * Crea un producto nuevo.
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
 *
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

    /**
     * Normalizamos primero el producto
     * existente. Esto permite editar productos
     * antiguos sin perder sus datos.
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
 *
 * Elimina un producto.
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
 *
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
