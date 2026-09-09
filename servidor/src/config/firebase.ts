import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

// Cargar serviceAccountKey.json de forma segura
const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), "serviceAccountKey.json"), "utf8"),
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
