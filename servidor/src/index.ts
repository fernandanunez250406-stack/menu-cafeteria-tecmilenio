import cors from "cors";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import "./config/firebase.js";
import cafeteriaRoutes from "./routes/cafeteria.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", cafeteriaRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.get("/", (req: Request, res: Response) => {
  res.json({ status: "API de Cafetería Tecmilenio funcionando correctamente" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
