# ☕ Cafetería Tecmilenio

Aplicación móvil y web desarrollada para la gestión digital del menú y pedidos de la cafetería de Tecmilenio.

El sistema permite a los clientes consultar el menú, agregar productos al carrito y realizar pedidos. También cuenta con un módulo administrativo para gestionar productos y consultar y actualizar el estado de los pedidos.

---

## 📌 Descripción

**Cafetería Tecmilenio** es una aplicación cliente-servidor desarrollada como proyecto académico.

El sistema está dividido en dos partes principales:

- **Frontend:** aplicación desarrollada con React Native, Expo y TypeScript.
- **Backend:** API REST desarrollada con Node.js, Express y TypeScript.

La información de productos y pedidos se gestiona mediante **Firebase Firestore**, mientras que las imágenes de los productos se pueden almacenar mediante **Cloudinary**.

---

# ✨ Funcionalidades

## 👤 Cliente

El usuario puede:

- Consultar el menú.
- Consultar productos por categoría.
- Visualizar nombre, precio e imagen de los productos.
- Agregar productos al carrito.
- Modificar cantidades.
- Eliminar productos del carrito.
- Registrar pedidos.
- Consultar sus pedidos.
- Consultar el estado de sus pedidos.

### Estados de los pedidos

Los pedidos pueden pasar por los siguientes estados:

```text
pendiente
preparando
listo
entregado
cancelado
```

---

## 🔐 Administrador

El módulo administrativo permite:

- Iniciar sesión como administrador.
- Consultar productos.
- Agregar productos.
- Editar productos.
- Gestionar imágenes de productos.
- Consultar pedidos.
- Consultar el detalle de los pedidos.
- Actualizar el estado de los pedidos.

---

# 🛠️ Tecnologías

## Frontend

- React Native
- Expo 57
- Expo Router
- TypeScript
- React Native Web
- AsyncStorage
- Expo Image Picker

## Backend

- Node.js
- Express
- TypeScript
- CORS
- dotenv

## Base de datos

- Firebase
- Cloud Firestore
- Firebase Admin SDK

## Almacenamiento de imágenes

- Cloudinary

## Control de versiones

- Git
- GitHub

---

# 🏗️ Arquitectura

El proyecto utiliza una arquitectura cliente-servidor:

```text
┌───────────────────────────────┐
│          FRONTEND             │
│       React Native + Expo     │
│          TypeScript           │
└───────────────┬───────────────┘
                │
                │ HTTP / REST API
                ▼
┌───────────────────────────────┐
│           BACKEND             │
│       Node.js + Express       │
│          TypeScript           │
└───────────────┬───────────────┘
                │
                │ Firebase Admin
                ▼
┌───────────────────────────────┐
│       FIREBASE FIRESTORE      │
│          Base de datos        │
└───────────────────────────────┘

                │
                ▼
┌───────────────────────────────┐
│          CLOUDINARY           │
│       Imágenes de menú        │
└───────────────────────────────┘
```

---

# 📁 Estructura del proyecto

```text
menu-cafeteria-tecmilenio/
│
├── assets/
│
├── scripts/
│
├── servidor/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
│
├── src/
│   ├── app/
│   ├── components/
│   ├── contexts/
│   └── ...
│
├── .gitignore
├── app.json
├── eas.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

# 💻 Requisitos

Antes de ejecutar el proyecto es necesario instalar:

- Node.js
- npm
- Git
- Una cuenta de Firebase
- Un proyecto de Firebase con Firestore habilitado
- Una cuenta de Cloudinary si se desea utilizar el almacenamiento de imágenes

Para comprobar Node.js:

```bash
node -v
```

Para comprobar npm:

```bash
npm -v
```

Para comprobar Git:

```bash
git --version
```

---

# 📥 Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/fernandanunez250406-stack/menu-cafeteria-tecmilenio.git
```

Entrar al proyecto:

```bash
cd menu-cafeteria-tecmilenio
```

---

# 📦 2. Instalar dependencias del frontend

Desde la carpeta principal:

```bash
npm install
```

---

# ⚙️ 3. Configurar el frontend

Crear en la raíz del proyecto un archivo llamado:

```text
.env.local
```

Agregar:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000/api
```

Ejemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

### Importante

`TU_IP_LOCAL` debe reemplazarse por la dirección IP de la computadora donde se está ejecutando el backend.

Si se ejecuta la aplicación desde un dispositivo físico, el teléfono y la computadora deben encontrarse en la misma red cuando se utiliza una conexión local.

No subir `.env.local` a GitHub.

---

# 🔥 4. Configurar Firebase

El backend utiliza Firebase Admin SDK para conectarse con Firestore.

Se necesita:

1. Crear un proyecto en Firebase.
2. Activar Cloud Firestore.
3. Crear una cuenta de servicio.
4. Obtener las credenciales necesarias para Firebase Admin SDK.
5. Configurar las credenciales en el entorno del backend.

Las credenciales de Firebase son información privada y no deben publicarse en GitHub.

---

# ☁️ 5. Configurar Cloudinary

Cloudinary se utiliza para almacenar imágenes de los productos.

Crear una cuenta en Cloudinary y obtener:

```env
CLOUDINARY_CLOUD_NAME=TU_CLOUD_NAME
CLOUDINARY_API_KEY=TU_API_KEY
CLOUDINARY_API_SECRET=TU_API_SECRET
```

Estas variables deben configurarse únicamente en el entorno local.

No publicar las credenciales reales.

---

# 🖥️ 6. Instalar y configurar el backend

Entrar a la carpeta del servidor:

```bash
cd servidor
```

Instalar las dependencias:

```bash
npm install
```

Crear:

```text
servidor/.env
```

Configurar las variables requeridas por el backend.

Ejemplo:

```env
PORT=3000

FIREBASE_SERVICE_ACCOUNT_JSON=TU_CREDENCIAL_DE_FIREBASE

CLOUDINARY_CLOUD_NAME=TU_CLOUD_NAME
CLOUDINARY_API_KEY=TU_API_KEY
CLOUDINARY_API_SECRET=TU_API_SECRET
```

> Nunca utilizar las credenciales mostradas como valores reales. Son únicamente un ejemplo de configuración.

---

# 🚀 7. Ejecutar el backend

Desde:

```text
menu-cafeteria-tecmilenio/servidor
```

ejecutar:

```bash
npm run dev
```

El backend compila TypeScript y posteriormente inicia el servidor.

El puerto utilizado por el proyecto es:

```text
3000
```

La API se utiliza mediante:

```text
http://localhost:3000/api
```

---

# 📱 8. Ejecutar la aplicación

Abrir otra terminal.

Regresar a la carpeta principal:

```bash
cd ..
```

Ejecutar:

```bash
npm start
```

El proyecto ejecutará el script de inicio configurado para Expo.

También puede ejecutarse directamente:

```bash
npx expo start
```

---

# 📲 Ejecutar en diferentes plataformas

## Android

```bash
npm run android
```

## iOS

```bash
npm run ios
```

## Web

```bash
npm run web
```

También es posible utilizar Expo Go para realizar pruebas en un dispositivo compatible.

---

# 🔌 Conexión con el backend

La aplicación utiliza:

```env
EXPO_PUBLIC_API_URL
```

para conocer la dirección de la API.

Ejemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

La dirección IP debe corresponder a la computadora donde se ejecuta el backend.

Si el frontend muestra errores de conexión:

1. Verificar que el backend esté ejecutándose.
2. Verificar la dirección IP.
3. Verificar que el puerto sea `3000`.
4. Verificar que el dispositivo y la computadora estén en la misma red.
5. Revisar el archivo `.env.local`.
6. Reiniciar Expo después de modificar las variables de entorno.

---

# 🔌 API

El backend proporciona endpoints para gestionar principalmente productos y pedidos.

Entre las operaciones utilizadas por la aplicación se encuentran:

```text
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
```

## Pedidos

### Consultar pedidos

```http
GET /api/orders
```

### Consultar un pedido

```http
GET /api/orders/:id
```

### Actualizar estado

```http
PATCH /api/orders/:id
```

Los estados disponibles son:

```text
pendiente
preparando
listo
entregado
cancelado
```

---

# 🛒 Flujo del cliente

```text
Inicio
  │
  ▼
Menú
  │
  ▼
Seleccionar producto
  │
  ▼
Agregar al carrito
  │
  ▼
Revisar carrito
  │
  ▼
Confirmar pedido
  │
  ▼
Pedido registrado
  │
  ▼
Consultar pedido
  │
  ▼
Consultar estado
```

---

# 🔐 Flujo administrativo

```text
Login
  │
  ▼
Panel administrativo
  │
  ├───────────────┐
  ▼               ▼
Productos       Pedidos
  │               │
  ▼               ▼
Agregar /       Consultar /
Editar          actualizar
  │               │
  └───────┬───────┘
          ▼
       Firebase
```

---

# ♿ Accesibilidad

Durante el desarrollo se consideraron principios de accesibilidad y facilidad de uso:

- Contraste adecuado entre elementos.
- Textos legibles.
- Elementos interactivos claramente identificables.
- Navegación estructurada.
- Adaptación a diferentes tamaños de pantalla.
- Uso de propiedades de accesibilidad en elementos interactivos cuando corresponde.

---

# 📱 Diseño adaptable

La aplicación utiliza React Native y React Native Web para permitir su ejecución en diferentes entornos.

La interfaz considera:

- Dispositivos móviles.
- Diferentes resoluciones.
- Visualización web.
- Distribución adaptable de componentes.
- Navegación mediante Expo Router.

---

# 🧪 Pruebas funcionales

Antes de considerar el proyecto terminado se deben verificar los siguientes casos.

## Cliente

- [ ] La aplicación inicia correctamente.
- [ ] El menú se muestra correctamente.
- [ ] Las categorías funcionan.
- [ ] Los productos muestran nombre, precio e imagen.
- [ ] Los productos pueden agregarse al carrito.
- [ ] Las cantidades pueden modificarse.
- [ ] Los productos pueden eliminarse del carrito.
- [ ] Se puede realizar un pedido.
- [ ] El pedido se registra correctamente.
- [ ] El pedido puede consultarse.
- [ ] El estado del pedido se actualiza correctamente.

## Administrador

- [ ] El administrador puede iniciar sesión.
- [ ] Puede consultar productos.
- [ ] Puede agregar productos.
- [ ] Puede editar productos.
- [ ] Puede gestionar imágenes.
- [ ] Puede consultar pedidos.
- [ ] Puede consultar el detalle de un pedido.
- [ ] Puede actualizar el estado de un pedido.

## Backend

- [ ] El servidor inicia correctamente.
- [ ] Firebase responde correctamente.
- [ ] Firestore permite consultar y almacenar información.
- [ ] Las rutas de pedidos funcionan.
- [ ] Las variables de entorno están configuradas.
- [ ] Cloudinary funciona correctamente cuando se utiliza para imágenes.

---

# 📸 Evidencia técnica

Para documentar el desarrollo y demostrar las funcionalidades del proyecto se recomienda incluir capturas de:

1. Pantalla principal.
2. Menú.
3. Categorías.
4. Detalle de producto.
5. Carrito.
6. Confirmación del pedido.
7. Consulta de pedidos.
8. Inicio de sesión administrativo.
9. Panel administrativo.
10. Gestión de productos.
11. Gestión de pedidos.
12. Cambio de estado de un pedido.

También pueden incluirse fragmentos de código relevantes para justificar decisiones técnicas.

---

# 🎥 Video de demostración

El video de demostración debe mostrar el funcionamiento completo de la aplicación.

Se recomienda incluir:

1. Inicio de la aplicación.
2. Navegación por el menú.
3. Consulta de categorías.
4. Selección de productos.
5. Agregado al carrito.
6. Modificación del carrito.
7. Creación de un pedido.
8. Consulta del pedido.
9. Inicio de sesión administrativo.
10. Consulta de pedidos.
11. Cambio del estado de un pedido.
12. Gestión de productos.
13. Funcionamiento de la aplicación en un dispositivo o navegador.
14. Simulación del proceso de publicación en Google Play.

---

# 🔒 Seguridad

No se deben publicar en el repositorio:

- Contraseñas.
- API Keys.
- Tokens.
- Credenciales de Firebase.
- Claves privadas.
- Archivos `.env`.
- Archivos `serviceAccountKey.json`.

El proyecto incluye reglas en `.gitignore` para evitar subir archivos de configuración y credenciales sensibles.

Antes de realizar un `git push`, comprobar:

```bash
git status
```

---

# 📚 Comandos principales

## Frontend

Instalar dependencias:

```bash
npm install
```

Iniciar Expo:

```bash
npm start
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

Web:

```bash
npm run web
```

Lint:

```bash
npm run lint
```

---

## Backend

Entrar al servidor:

```bash
cd servidor
```

Instalar dependencias:

```bash
npm install
```

Modo desarrollo:

```bash
npm run dev
```

Compilar:

```bash
npm run build
```

Iniciar versión compilada:

```bash
npm start
```

---

# 👥 Equipo

Proyecto desarrollado por estudiantes de Tecmilenio.

## Integrantes

- Fernanda Núñez
- Gabriel
- Integrantes del equipo

---

# 🔗 Repositorio

Código fuente:

https://github.com/fernandanunez250406-stack/menu-cafeteria-tecmilenio.git

---

# 🎓 Reto Final — Fase II

Proyecto desarrollado como parte del **Reto Final Fase II** de Tecmilenio.

El proyecto integra frontend, backend, base de datos, gestión de pedidos, módulo administrativo, diseño adaptable y documentación técnica.
