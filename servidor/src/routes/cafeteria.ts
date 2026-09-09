import { Request, Response, Router } from "express";
import { db } from "../config/firebase.js";

const router = Router();

router.get("/menu", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("menu").get();
    const menu = snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      }),
    );
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el menú" });
  }
});

router.post("/menu", async (req: Request, res: Response) => {
  try {
    const { name, price, category, customizations } = req.body;
    const newProduct = {
      name,
      price,
      category,
      customizations: customizations || [],
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection("menu").add(newProduct);
    res.status(201).json({ id: docRef.id, ...newProduct });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar el producto" });
  }
});

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
    res.status(201).json({ id: docRef.id, ...newOrder });
  } catch (error) {
    res.status(500).json({ error: "Error al crear la orden" });
  }
});

export default router;
