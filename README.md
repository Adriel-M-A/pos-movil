# POS Simple para Kiosco (DirectPOS Kiosk)

Aplicación móvil monousuario para control de ventas diarias y arqueo de caja en kioscos, diseñada con un enfoque **local-first (100% offline)** y optimizada para operar con la menor fricción y máxima velocidad posible.

---

## 🚀 Características Principales

- **Apertura y Cierre de Caja:** Control estricto de caja por sesión (jornada comercial) cruzando medianoches si es necesario.
- **Cobro Rápido con Teclado Custom:** Teclado numérico integrado gigante en pantalla que optimiza la carga de montos y evita el uso del teclado nativo del sistema operativo.
- **Soporte de Pagos Mixtos:** Permite registrar cobros donde el cliente combina múltiples medios de pago (Efectivo, QR, Transferencia y Tarjeta de Crédito) en una sola venta.
- **Reportes Visuales Integrados:** Gráficos interactivos de evolución de facturación diaria y desglose por canal de cobro.
- **Exportación CSV y Respaldo:** Permite exportar todo el historial de ventas y cierres a un archivo CSV para abrir en Excel o Google Sheets, compartiéndolo mediante el menú nativo del dispositivo.
- **100% Offline (Sin Nube):** No requiere internet para ninguna de sus operaciones. Almacenamiento local seguro en base de datos SQLite.

---

## 🛠️ Stack Tecnológico

- **Framework:** [Expo](https://expo.dev/) (React Native) con TypeScript.
- **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing).
- **Base de datos:** [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) local.
- **ORM / Migraciones:** [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit.
- **Gráficos:** [react-native-gifted-charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts).
- **Estilos:** `StyleSheet` nativo de React Native (sin librerías visuales externas).
- **Fuentes:** `Hanken Grotesk` (Google Fonts) para UI general y `JetBrains Mono` para datos numéricos alineados.

---

## 📂 Estructura del Proyecto

- `app/`: Directorio principal de rutas gestionado por Expo Router.
  - `(tabs)/`: Pestañas inferiores (Dashboard, Cobro, Reportes, Ajustes).
  - `_layout.tsx`: Inicializa la base de datos, ejecuta migraciones y carga fuentes tipográficas.
  - `cierre.tsx`: Pantalla dedicada al arqueo y confirmación física de cierre.
- `src/`: Código fuente de la aplicación.
  - `components/`: Componentes reutilizables (Teclado, Botón, Tarjeta, Chips de pago, Diálogo de confirmación).
  - `context/`: Proveedor del estado global de la caja (`CajaContext`).
  - `db/`: Inicialización del cliente SQLite, scripts de migración y repositorio de base de datos (`repositorio.ts`).
  - `hooks/`: Carga asíncrona de tipografías.
  - `theme.ts`: Tokens visuales y colores de la aplicación (DirectPOS Kiosk).
  - `types/`: Interfaces estrictas de TypeScript de los modelos de datos.

---

## 💻 Desarrollo Local

### Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior).
- Dispositivo físico con la app **Expo Go** o un emulador de Android/iOS configurado.

### Instalación de Dependencias

Cloná el repositorio e instalá los paquetes:

```bash
npm install
```

### Gestión de Base de Datos y Migraciones

Si realizás cambios en el esquema de base de datos en [schema.ts](file:///d:/code/pos-movil/src/db/schema.ts), ejecutá los siguientes comandos para generar y sincronizar las migraciones locales:

```bash
# Generar archivos de migración de Drizzle
npm run db:generate

# Iniciar Drizzle Studio en tu navegador para inspeccionar la base de datos (opcional)
npm run db:studio
```

### Ejecutar el Proyecto

Iniciá el servidor de desarrollo de Expo:

```bash
npm start
```

Presioná **a** para abrir en un emulador de Android, o escaneá el código QR desde tu celular usando la cámara (iOS) o la aplicación Expo Go (Android).
