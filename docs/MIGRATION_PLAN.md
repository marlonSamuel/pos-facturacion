# 🚀 PLAN DE MIGRACIÓN — NEW HORIZON

> **Origen:** `inventarios/` (PHP 7+ nativo, MySQL, FPDF, AdminLTE 2, jQuery)
> **Destino:** `FACTURACION/api/` (Node.js + Express + TypeScript + Sequelize) + `FACTURACION/front/` (React 18 + TypeScript + Ant Design)

---

## 📐 Arquitectura destino

```
FACTURACION/
├── api/                          → Backend (Node.js + Express + TypeScript)
│   ├── config/                   → .env (development, production, staging)
│   ├── src/
│   │   ├── app.ts                → Entry point (dotenv + instancia Server)
│   │   ├── server.ts             → Express + CORS + JWT + Sequelize + Awilix
│   │   ├── container.ts          → Awilix DI (registro de servicios)
│   │   ├── common/
│   │   │   ├── database/
│   │   │   │   └── mysql.ts          → Conexión Sequelize
│   │   │   ├── errors/
│   │   │   │   └── application.exception.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts    → JWT validation + permisos
│   │   │   │   └── validate-fields.ts    → express-validator
│   │   │   └── base/
│   │   │       └── base.controller.ts
│   │   ├── controllers/          → Controladores REST
│   │   │   ├── AuthController.ts
│   │   │   ├── ArticleController.ts
│   │   │   ├── CategoryController.ts
│   │   │   ├── PersonController.ts    → Clientes + Proveedores
│   │   │   ├── UserController.ts
│   │   │   ├── PurchaseController.ts  → Ingresos/Compras
│   │   │   ├── SaleController.ts      → Ventas + DTE
│   │   │   ├── DashboardController.ts → Reportes y estadísticas
│   │   │   └── ReportController.ts    → Consultas varias
│   │   ├── services/             → Lógica de negocio
│   │   │   ├── AuthService.ts
│   │   │   ├── ArticleService.ts
│   │   │   ├── CategoryService.ts
│   │   │   ├── PersonService.ts
│   │   │   ├── UserService.ts
│   │   │   ├── PurchaseService.ts
│   │   │   ├── SaleService.ts
│   │   │   ├── DteService.ts         → Lógica SAT Digifact
│   │   │   ├── DashboardService.ts
│   │   │   └── ReportService.ts
│   │   ├── models/               → Entidades Sequelize + asociaciones
│   │   │   ├── User.ts
│   │   │   ├── Permission.ts
│   │   │   ├── UserPermission.ts
│   │   │   ├── Category.ts
│   │   │   ├── Product.ts
│   │   │   ├── Person.ts
│   │   │   ├── Purchase.ts
│   │   │   ├── PurchaseDetail.ts
│   │   │   ├── Sale.ts
│   │   │   ├── SaleDetail.ts
│   │   │   ├── DteToken.ts
│   │   │   ├── SatInvoice.ts
│   │   │   └── Associations.ts       → Asociaciones entre modelos
│   │   └── dtos/                 → Interfaces/DTOs
│   │       ├── IAuth.ts
│   │       ├── IArticle.ts
│   │       ├── ICategory.ts
│   │       ├── IPerson.ts
│   │       ├── IUser.ts
│   │       ├── IPurchase.ts
│   │       ├── ISale.ts
│   │       └── IApp.ts
│   ├── database/
│   │   ├── migrations/          → Sequelize migrations versionadas
│   │   └── seeders/             → Datos iniciales (permisos, admin)
│   └── package.json
│
└── front/                       → Frontend (React + TypeScript + Ant Design)
    ├── public/
    ├── src/
    │   ├── api/
    │   │   └── axios.ts             → Instancia Axios con interceptor JWT
    │   ├── context/
    │   │   ├── auth/
    │   │   │   ├── AuthContext.tsx
    │   │   │   └── AuthReducer.tsx
    │   │   ├── sale/
    │   │   │   └── SaleContext.tsx   → Carrito de ventas
    │   │   ├── shop/
    │   │   │   └── ShopContext.tsx   → Carrito de compras
    │   │   └── UIContext.tsx
    │   ├── hooks/                    → Custom hooks (capa API)
    │   │   ├── useAuth.ts
    │   │   ├── useArticle.ts
    │   │   ├── useCategory.ts
    │   │   ├── usePerson.ts
    │   │   ├── useUser.ts
    │   │   ├── usePurchase.ts
    │   │   ├── useSale.ts
    │   │   ├── useDashboard.ts
    │   │   └── useReport.ts
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   └── LoginPage.tsx
    │   │   ├── dashboard/
    │   │   │   └── DashboardPage.tsx
    │   │   ├── inventory/
    │   │   │   ├── ArticlePage.tsx
    │   │   │   ├── CategoryPage.tsx
    │   │   │   └── CreateOrEditProduct.tsx
    │   │   ├── persons/
    │   │   │   ├── ClientPage.tsx
    │   │   │   └── ProviderPage.tsx
    │   │   ├── users/
    │   │   │   ├── UserPage.tsx
    │   │   │   └── ProfilePage.tsx
    │   │   ├── purchases/
    │   │   │   ├── MainPurchase.tsx
    │   │   │   └── PurchaseList.tsx
    │   │   ├── sales/
    │   │   │   ├── MainSale.tsx
    │   │   │   └── SaleList.tsx
    │   │   └── reports/
    │   │       └── ReportPage.tsx
    │   ├── components/
    │   │   └── shared/
    │   │       ├── SideBar.tsx
    │   │       ├── Header.tsx
    │   │       ├── Footer.tsx
    │   │       └── BreadCrumb.tsx
    │   ├── router/
    │   │   ├── AppRouter.tsx
    │   │   ├── AuthRouter.tsx
    │   │   ├── PrivateRoute.tsx
    │   │   └── PublicRoute.tsx
    │   ├── interfaces/
    │   │   ├── IAuth.ts
    │   │   ├── IArticle.ts
    │   │   ├── ICategory.ts
    │   │   ├── IPerson.ts
    │   │   ├── IUser.ts
    │   │   ├── IPurchase.ts
    │   │   ├── ISale.ts
    │   │   └── IApp.ts
    │   └── helpers/
    │       ├── shared.ts
    │       └── constants.ts
    └── package.json
```

---

## 🗺️ Módulos a migrar (alcance completo)

Basado en el análisis del sistema legacy `inventarios/`:

| # | Módulo | Modelo PHP | Entidad BD | Prioridad |
|---|--------|-----------|------------|-----------|
| 1 | **Auth** | `Usuario.verificar()` | `usuario` | 🔴 Alta |
| 2 | **Dashboard** | `Consultas.php` (totales, gráficos) | Varias tablas | 🔴 Alta |
| 3 | **Categorías** | `Categoria.php` | `categoria` | 🔴 Alta |
| 4 | **Artículos** | `Articulo.php` | `articulo` + upload imágenes | 🔴 Alta |
| 5 | **Clientes** | `Persona.php` (tipo_persona='Cliente') | `persona` | 🔴 Alta |
| 6 | **Proveedores** | `Persona.php` (tipo_persona='Proveedor') | `persona` | 🔴 Alta |
| 7 | **Usuarios** | `Usuario.php` + `usuario_permiso` | `usuario` + `usuario_permiso` + `permiso` | 🔴 Alta |
| 8 | **Compras (Ingresos)** | `Ingreso.php` + `detalle_ingreso` + **trigger `tr_updStockIngreso`** | `ingreso` + `detalle_ingreso` + stock vía servicio (no trigger) | 🔴 Alta |
| 9 | **Ventas** | `Venta.php` + `detalle_venta` + **trigger `tr_updStockVenta`** | `venta` + `detalle_venta` + stock vía servicio (no trigger) | 🔴 Alta |
| 10 | **DTE (Factura Electrónica)** | `Dte12.php` + `Dte.php` | `sat_facturas` + `token_dte` | 🔴 Alta |
| 11 | **Audit Logs** | No hay modelo (solo tabla `bitacora_logs`) | `bitacora_logs` | 🟡 Media |
| 12 | **Reportes** | `Consultas.php` (consultas por fechas, vista `COMPRASVSVENTAS`) | Varias tablas + vista | 🟡 Media |
| 13 | **Exportación PDF** | `reportes/*.php` (FPDF) | — | 🟡 Media |

---

## 📦 Dependencias del proyecto (versiones latest verificadas — Julio 2026)

### Backend (`api/package.json`)

```json
{
  "dependencies": {
    "express": "^5.2.1",
    "awilix": "^13.0.5",
    "awilix-express": "^11.0.1",
    "sequelize": "^6.37.8",
    "mysql2": "^3.23.0",
    "dotenv": "^17.4.2",
    "cors": "^2.8.6",
    "express-jwt": "^8.5.1",
    "jsonwebtoken": "^9.0.3",
    "express-validator": "^7.3.2",
    "axios": "^1.18.1",
    "multer": "^2.2.0",
    "moment": "^2.30.1"
  },
  "devDependencies": {
    "typescript": "^7.0.2",
    "ts-node-dev": "^2.0.0",
    "sequelize-cli": "^6.6.5",
    "@types/express": "^5.0.6",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/multer": "^2.2.0"
  }
}
```

### Frontend (`front/package.json`)

```json
{
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1",
    "antd": "^6.5.1",
    "@ant-design/icons": "^6.3.2",
    "axios": "^1.18.1",
    "moment": "^2.30.1"
  },
  "devDependencies": {
    "typescript": "^7.0.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3"
  }
}
```

### Node.js

| | Versión |
|---|---------|
| **Instalado actualmente** | **v24.11.1** |
| **npm** | **11.6.2** |

---

## 📋 PLAN POR FASES

---

### 🔷 FASE 0 — INFRAESTRUCTURA INICIAL (Setup) ✅ COMPLETADA

**Objetivo:** Tener ambos proyectos vacíos pero funcionales, con conexión a BD.
**✅ Realizado:** Proyectos `api/` y `front/` creados, dependencias instaladas, servidor Express arranca, frontend compila.

#### Backend

| Paso | Acción | Detalle |
|------|--------|---------|
| 0.1 | `npm init` + instalar dependencias | Express, TypeScript, Awilix, Sequelize, mysql2, dotenv, cors, express-jwt, jsonwebtoken, express-validator |
| 0.2 | Configurar TypeScript `tsconfig.json` | `target: es2016`, `module: commonjs`, `experimentalDecorators: true`, `emitDecoratorMetadata: true` |
| 0.3 | Crear estructura de carpetas | `src/`, `src/common/`, `src/modules/`, `database/migrations/`, `config/` |
| 0.4 | Implementar `src/common/database/mysql.ts` | Conexión Sequelize desde variables de entorno |
| 0.5 | Implementar `src/common/errors/application.exception.ts` | Excepción personalizada con statusCode |
| 0.6 | Implementar `src/common/base/base.controller.ts` | Clase abstracta con `handleException()` |
| 0.7 | Implementar `src/common/middleware/validate-fields.ts` | Middleware express-validator |
| 0.8 | Implementar `src/server.ts` | Clase Server: Express + CORS + JWT + Sequelize + Awilix |
| 0.9 | Implementar `src/app.ts` | Entry point con dotenv multi-entorno |
| 0.10 | Implementar `src/container.ts` | Contenedor Awilix vacío |
| 0.11 | Configurar `package.json scripts` | `"start": "ts-node src/app.ts"`, `"start:dev": "tsnd --respawn src/app.ts"` |
| 0.12 | Configurar `.env` en `config/` | development.env, production.env, staging.env |
| 0.13 | Agregar script de base de datos de inventarios (como script inicial de migración manual) | Archivo SQL de referencia |

#### Frontend

| Paso | Acción | Detalle |
|------|--------|---------|
| 0.14 | `npx create-react-app front --template typescript` | Proyecto React + TypeScript |
| 0.15 | Instalar dependencias adicionales | antd, @ant-design/icons, axios, react-router-dom, moment |
| 0.16 | Crear estructura de carpetas | `src/api/`, `src/context/`, `src/hooks/`, `src/pages/`, `src/components/shared/`, `src/router/`, `src/interfaces/`, `src/helpers/` |
| 0.17 | Implementar `src/api/axios.ts` | Instancia Axios con interceptor JWT |
| 0.18 | Implementar `src/context/UIContext.tsx` | Loading global + Breadcrumb |
| 0.19 | Implementar `src/context/auth/AuthContext.tsx` + `AuthReducer.tsx` | Estado de autenticación |
| 0.20 | Implementar sistema de rutas | `AppRouter.tsx`, `AuthRouter.tsx`, `PrivateRoute.tsx`, `PublicRoute.tsx` |
| 0.21 | Implementar layout base | `SideBar.tsx`, `Header.tsx`, `Footer.tsx`, `BreadCrumb.tsx`, `DefaultPage.tsx` |
| 0.22 | `src/GeApp.tsx` | Componente raíz con Providers |
| 0.23 | LoginPage básica | UI con Ant Design, conectada a AuthContext |
| 0.24 | Verificar build | `npm run build` sin errores |

**✅ Criterio de éxito:** `npm run start:dev` en backend responde en `:3000`, frontend compila sin errores.

---

### 🔷 FASE 1 — MÓDULO AUTH + DASHBOARD ✅ COMPLETADA

**Objetivo:** Login funcional, JWT, control de acceso por roles, dashboard con indicadores.

> ⚠️ Los modelos Sequelize usarán `tableName: 'usuario'`, `tableName: 'permiso'`, `tableName: 'usuario_permiso'` — **exactamente los mismos nombres de tabla**. Si la BD ya existe (producción/local con datos), las migraciones se saltan. Si es local vacía, las migraciones crean las tablas.

#### Backend

| Paso | Acción | Archivos |
|------|--------|----------|
| 1.1 | **Migration:** Tabla `usuario` (mismo nombre) | `database/migrations/xxxx-create-usuario.ts` |
| 1.2 | **Migration:** Tabla `permiso` (mismo nombre) | `database/migrations/xxxx-create-permiso.ts` |
| 1.3 | **Migration:** Tabla `usuario_permiso` (mismo nombre) | `database/migrations/xxxx-create-usuario_permiso.ts` |
| 1.4 | **Modelo Sequelize:** `Usuario.ts` + `Permiso.ts` + `UsuarioPermiso.ts` con asociaciones | `src/models/` |
| 1.5 | **AuthController:** `POST /auth/login`, `GET /auth/me` | `src/controllers/AuthController.ts` |
| 1.6 | **AuthService:** `login()`, `verifyToken()`, `validateRole()` con bcrypt + JWT | `src/services/AuthService.ts` |
| 1.7 | **AuthDto:** `ILoginDto`, `IUserDto` | `src/dtos/IAuth.ts` |
| 1.8 | **Middleware:** `auth.middleware.ts` — Validar JWT + permisos por módulo | Basado en la lógica de `$_SESSION["ventas"]`, etc. |
| 1.9 | **DashboardController:** `GET /dashboard/summary` | Totals del día, mes, gráficos |
| 1.10 | **DashboardService:** queries de totales (ventas hoy, compras hoy, facturas DTE activas, impuestos, etc.) | Migrar lógica de `Consultas.php` |

#### Frontend

| Paso | Acción | Archivos |
|------|--------|----------|
| 1.11 | **LoginPage** completa | Formulario con validación, conexión a AuthContext |
| 1.12 | **DashboardPage** | Cards con indicadores (Q total facturas, Q impuestos, cantidad facturas, anuladas) |
| 1.13 | **Gráfico compras vs ventas** | Chart con datos del año |
| 1.14 | **SideBar** con menú dinámico según permisos | Basado en roles del usuario |

**✅ Criterio de éxito:** Login funcional, redirección a dashboard, datos reales desde BD.

---

### 🔷 FASE 2 — MÓDULO CATEGORÍAS + ARTÍCULOS ✅ COMPLETADA

**Objetivo:** CRUD completo de categorías y artículos con subida de imágenes.

> ⚠️ Las tablas mantienen su nombre original: `categoria` y `articulo`. Modelos Sequelize con `tableName: 'categoria'` y `tableName: 'articulo'`.

#### Backend

| Paso | Acción | Estado |
|------|--------|--------|
| 2.1 | **Modelo:** `Categoria.ts` + `Articulo.ts` con asociación | ✅ |
| 2.2 | **Migration:** Tabla `categoria` (si no existe) | ✅ |
| 2.3 | **Migration:** Tabla `articulo` (si no existe) | ✅ |
| 2.4 | **CategoryController:** CRUD con decoradores Awilix | ✅ |
| 2.5 | **CategoryService:** insertar, editar, desactivar/activar, listar | ✅ |
| 2.6 | **ArticleController:** CRUD + subida de imágenes con multer | ✅ |
| 2.7 | **ArticleService:** CRUD + manejo de imágenes (último precio de compra) | ✅ |
| 2.8 | Endpoint `GET /api/articles/active-for-sale` | ✅ |

#### Frontend

| Paso | Acción | Estado |
|------|--------|--------|
| 2.9 | **CategoryPage:** Tabla + modal crear/editar + eliminar | ✅ |
| 2.10 | **ArticlePage:** Tabla con búsqueda + imagen + stock, código de barras | ✅ |
| 2.11 | **ArticleForm:** Modal 2 columnas, upload imagen, vista previa código barras | ✅ |
| 2.12 | Registrar rutas en SideBarRouter | ✅ |

**✅ Criterio de éxito:** CRUD completo de categorías y artículos, imágenes subidas y visibles, códigos de barras.

---

### 🔷 FASE 3 — MÓDULO CLIENTES + PROVEEDORES ✅ COMPLETADA

**Objetivo:** Gestión de personas (clientes y proveedores) en una sola tabla con discriminador.

> ⚠️ La tabla legacy es `persona` con campo `tipo_persona = 'Cliente' | 'Proveedor'`. Se mantiene exactamente igual.

#### Backend

| Paso | Acción | Estado |
|------|--------|--------|
| 3.1 | **Modelo:** `Persona.ts` con `tableName: 'persona'` | ✅ |
| 3.2 | **PersonaService:** CRUD + filtrar por tipo_persona | ✅ |
| 3.3 | **PersonaController:** endpoints clientes + proveedores | ✅ |
| 3.4 | Registrar en container.ts | ✅ |

#### Frontend

| Paso | Acción | Estado |
|------|--------|--------|
| 3.5 | **Cliente y Proveedor:** Index + List + Form con selects reutilizables | ✅ |
| 3.6 | **PersonForm:** Modal reutilizable (ClienteForm + ProveedorForm unificados) | ✅ |
| 3.7 | Selects reutilizables para ventas/compras (`InlinePersonSelect`) | ✅ |
| 3.8 | Rutas en SideBarRouter | ✅ |

**✅ Criterio de éxito:** CRUD de clientes y proveedores, visibles en selects de ventas/compras.

---

### 🔷 FASE 4 — MÓDULO USUARIOS + PERMISOS ✅ COMPLETADA

**Objetivo:** Administración de usuarios del sistema con asignación de permisos por módulo.

#### Backend

| Paso | Acción | Estado |
|------|--------|--------|
| 4.1 | **UserController:** CRUD completo + endpoints de perfil | ✅ |
| 4.2 | **UserService:** transaccional con bcrypt + permisos + perfil | ✅ |
| 4.3 | **PermissionController:** `GET /permissions` — catálogo de 8 permisos | ✅ |
| 4.4 | **ProfileController:** `GET /profile`, `PUT /profile`, `PUT /profile/change-password` | ✅ |
| 4.5 | **Refresh Token (dual JWT):** Access JWT (8h) + Refresh JWT (7d) sin BD, rotación automática | ✅ |
| 4.6 | **Permission middleware (`hasPermission`):** Aplicado a todos los controladores (almacen, ventas, compras, usuarios, escritorio) | ✅ |
| 4.7 | **Image upload:** multer para usuarios + perfil, eliminación de imagen anterior al actualizar | ✅ |
| 4.8 | **Auto-desactivación bloqueada:** No puedes desactivarte a ti mismo (403) | ✅ |
| 4.9 | **Validaciones:** login único, clave min 4, permisos array, imagen 2MB, tipo_documento in (DPI/NIT/CF) | ✅ |

#### Frontend

| Paso | Acción | Estado |
|------|--------|--------|
| 4.10 | **IUser.ts / IPermission:** Interfaces frontend | ✅ |
| 4.11 | **userService.ts + authService.ts:** Capa API con refresh token | ✅ |
| 4.12 | **useUser.ts:** Hook con estados + notificaciones | ✅ |
| 4.13 | **IndexUser.tsx:** Página con tabla + modal crear/editar | ✅ |
| 4.14 | **UserList.tsx:** Avatar, Switch estado, 🔒 cambiar contraseña en tabla | ✅ |
| 4.15 | **UserForm.tsx:** Modal 720px con foto, permisos checkbox grid, contraseña solo en creación | ✅ |
| 4.16 | **ChangePasswordModal:** Modal independiente para cambiar contraseña desde tabla | ✅ |
| 4.17 | **ProfilePage:** Diseño profesional con tabs (Información, Editar Perfil, Seguridad), avatar con hover camera, cambio de foto, cambio de contraseña | ✅ |
| 4.18 | **Axios interceptor:** 401 → refresh automático con cola de requests | ✅ |
| 4.19 | **AuthContext:** `updateUser()`, refreshToken en localStorage | ✅ |
| 4.20 | **SideBar + AppRouter:** Rutas `/users` y `/profile` registradas | ✅ |

**Detalles de implementación:**
- Arquitectura de permisos: JWT con scopes → middleware `hasPermission('X')` → 401/403
- Admin bypass: `cargo === 'admin'` pasa cualquier permiso automáticamente
- Refresh Token: JWT dual (access + refresh) sin tabla en BD, verificados por firma HMAC
- Imágenes: multer 2MB, filtro por extensión, eliminación de archivo anterior en update
- Formulario usuario: FormData con axios para soportar upload, normalizePermisos() para compatibilidad JSON/FormData
- ProfilePage: Tabs con Ant Design, avatar clickeable, diseño responsive, feedback visual en cambio de contraseña

**✅ Criterio de éxito:** CRUD de usuarios, asignación de permisos funcional, login respeta permisos, refresh token automático, perfil actualizable con foto, backend no se cae al editar.

---

### 🔷 FASE 5 — MÓDULO COMPRAS (INGRESOS) ✅ COMPLETADA

**Objetivo:** Registrar compras a proveedores con detalle y actualización automática de stock a nivel de aplicación (sin triggers).

> ⚠️ **Triggers legacy:** La BD actual tiene `tr_updStockIngreso` que suma stock al insertar en `detalle_ingreso` y resta al anular. En el nuevo sistema el control de stock se hace **en el Service Layer** con transacciones Sequelize. 
> **🚨 Al migrar a producción, hay que eliminar los triggers:**
> ```sql
> DROP TRIGGER IF EXISTS tr_updStockIngreso;
> DROP TRIGGER IF EXISTS tr_updStockVenta;
> ```

#### Backend

| Paso | Acción | Estado |
|------|--------|--------|
| 5.1 | **Migration:** Crear tabla `ingreso` + `detalle_ingreso` | ✅ |
| 5.2 | **Migration:** `precio_venta` nullable en `detalle_ingreso`, `precio_venta` en `articulo` | ✅ |
| 5.3 | **Modelos:** `Ingreso` + `DetalleIngreso` con asociaciones | ✅ |
| 5.4 | **PurchaseController:** CRUD + anular + listar detalle | ✅ |
| 5.5 | **PurchaseService:** `create()` transaccional, `cancel()` con reversión de stock | ✅ |
| 5.6 | Endpoint `GET /articles/:id/last-purchase-price` | ✅ |
| 5.7 | Validaciones: express-validator + hasPermission('compras') | ✅ |

#### Frontend

| Paso | Acción | Estado |
|------|--------|--------|
| 5.8 | **IPurchase.ts / IPurchaseDetail.ts:** Interfaces | ✅ |
| 5.9 | **purchaseService.ts:** Capa API | ✅ |
| 5.10 | **usePurchase.ts:** Hook con estados + notificaciones | ✅ |
| 5.11 | **ShopContext:** Carrito de compra (addItem, removeItem, updateQty, clear, total) | ✅ |
| 5.12 | **MainPurchase:** Selector proveedor + búsqueda artículos + cart sticky + totales | ✅ |
| 5.13 | **PurchaseList:** Tabla con filtros fecha/proveedor, Tag estado, anular con Popconfirm | ✅ |
| 5.14 | **PurchaseDetail:** Modal con Descriptions + Table + totales | ✅ |
| 5.15 | **InlineProviderSelect:** Crea proveedor inline desde la compra | ✅ |
| 5.16 | **InlineArticleSelect:** Crea artículo inline con stock=0 forzado, oculta campo stock | ✅ |
| 5.17 | **SideBar + AppRouter:** Rutas `/purchases/new` y `/purchases` | ✅ |

**🔑 Stock management (application level):**
```
CREATE (transaccional):
  1. INSERT INTO ingreso (cabecera)
  2. INSERT INTO detalle_ingreso (detalles)
  3. UPDATE articulo SET stock = stock + cantidad WHERE idarticulo = X

CANCEL (transaccional):
  1. UPDATE ingreso SET estado = 'Anulado'
  2. UPDATE articulo SET stock = stock - cantidad WHERE idarticulo = X
```

**Detalles de implementación:**
- Precio de venta ahora se almacena en `articulo.precio_venta` y es opcional en `detalle_ingreso.precio_venta`
- El carrito de compra acumula cantidades si se agrega el mismo artículo dos veces
- Artículos duplicados se filtran del dropdown al agregar a la compra (`excludeIds`)
- Al crear artículo desde compra, stock se fuerza a 0 (se actualizará con la compra)
- Último precio de compra se sugiere automáticamente al seleccionar artículo

**✅ Criterio de éxito:** Registro de compras con detalle, stock actualizado automáticamente, anulación funcional con reversión de stock, creación inline de proveedores y artículos.

---

### 🔷 FASE 6 — MÓDULO VENTAS + DTE (FACTURA ELECTRÓNICA) ✅ COMPLETADA

**Objetivo:** El módulo más complejo. Registrar ventas (Boleta/Ticket/Factura), certificar DTE ante SAT Digifact, generar PDFs profesionales. Incluye 3 tipos de comprobante con diferentes flujos de impresión.

> ✅ **Flujo de venta:** La certificación DTE ocurre ANTES de la transacción. Si DTE falla, la venta NO se crea (todo o nada). No existe estado `PendienteDTE`.

> ⚠️ **Triggers legacy:** La BD tiene `tr_updStockVenta` que resta stock al insertar en `detalle_venta`. En el nuevo sistema se maneja en **SaleService** con transacciones Sequelize. **🚨 Al migrar a producción, eliminar el trigger:**
> ```sql
> DROP TRIGGER IF EXISTS tr_updStockVenta;
> ```

#### Backend

| Paso | Acción | Estado |
|------|--------|--------|
| 6.1 | **Migration:** Tabla `venta` + `detalle_venta` (mismos nombres) | ✅ |
| 6.2 | **Migration:** Tabla `token_dte` + `sat_facturas` (mismos nombres) | ✅ |
| 6.3 | **Modelos:** `Venta`, `DetalleVenta`, `TokenDte`, `SatFactura` con asociaciones | ✅ |
| 6.4 | **DteService:** `login()`, `generarXML()`, `certify()`, `cancel()` — SAT Digifact API v3 | ✅ |
| 6.5 | **SaleController:** CRUD + anular + downloadPdf | ✅ |
| 6.6 | **SaleService:** `create()` transaccional (commit→DTE→update), `cancel()` con reversión stock + anulación DTE | ✅ |
| 6.7 | **PdfService:** PDFKit A4 profesional estilo FPDF legacy | ✅ |
| 6.8 | Descarga autenticada de PDFs (blob + axios con JWT, sin `window.open`) | ✅ |
| 6.9 | DTE: HTTPS nativo (no axios) para XML, SOAP Action headers, Lock timeout resuelto | ✅ |

#### Frontend

| Paso | Acción | Estado |
|------|--------|--------|
| 6.10 | **SaleContext:** Carrito (items sin acumulación, qty, descuento, clear) | ✅ |
| 6.11 | **MainSale (POS):** Catálogo visual en cards, search, category pills, carrito sidebar/mobile Drawer, 3 tipos comprobante | ✅ |
| 6.12 | **SaleList:** Tabla con filtros, Tag estado, imprimir/anular por tipo | ✅ |
| 6.13 | **SaleDetail:** Modal Descriptions + PDF download | ✅ |
| 6.14 | **InlineClientSelect:** Selector + creación inline de cliente | ✅ |
| 6.15 | **Flujo impresión:** Ticket→HTML (`window.print()`), Boleta→PDFKit, Factura→PDF DTE | ✅ |
| 6.16 | **Responsive POS:** Drawer móvil, floating bar, grids adaptativos | ✅ |

**Detalles de implementación:**

#### DTE (SAT Digifact)
- URLs base configuradas en `.env` por entorno (`DTE_AUTH_URL`, `DTE_CERT_URL_BASE`, `DTE_CANCEL_URL_BASE`) con placeholders `{NIT}` y `{USERNAME}` que se reemplazan dinámicamente con los valores de cada sucursal
- Columnas `auth_url_digifact`, `cert_url_digifact`, `cancel_url_digifact` eliminadas de `sucursal` (migración `20260726000001`)
- Columna `usuario_login` agregada a `sucursal` (migración `20260726000002`) — usuario completo para login API (ej: `GT.000044653948.PRUEBAS56`), separado de `usuario_digifact` (corto, ej: `PRUEBAS56`) que se usa en URLs
- Tabla `api_request_logs` creada (migración `20260726000003`) — registra cada request/response a Digifact para depuración
- Credenciales Digifact (usuario_digifact, usuario_login, password, NIT) por sucursal en tabla `sucursal`
- XML generado con template literals (no xml2js), decimals con `toFixed(4)`, escape de caracteres especiales
- Transmisión: `https.request` nativo (no axios — axios altera el XML raw)
- **Flujo transaccional (todo o nada):** DTE certifica ANTES de la transacción MySQL → si falla, no hay venta ni stock descontado
- **Rollback compensatorio:** Si DTE certifica en SAT pero la transacción DB falla → se anula automáticamente vía `anularPorAutorizacion()`
- `sat_facturas` se inserta dentro de la transacción (FK constraint satisfecha)
- Referencia interna única: `PRE-{idcliente}-{timestamp}` para evitar duplicados en SAT

#### PDF (PDFKit)
- Librería: `pdfkit` + `@types/pdfkit`
- **Boleta**: A4 profesional con logo empresa, pill tipo-documento, fecha box, datos cliente, tabla 6 columnas (bordes completos + separadores verticales), Importe Total con Letra + Totales, Recibí Conforme
- **Ticket**: HTML inline con `window.print()` mediante iframe oculto (no congela la UI)
- **Factura**: Sirve el PDF guardado de `sat_facturas.pdf_path` (generado por SAT Digifact)
- Distribución vertical: tabla se estira hasta el fondo, footer + firma quedan al final
- Esquema colores: `#0f172a` texto, `#1f2937` bordes, `#64d2d6` accent cyan
- Helper compartido: `printUtils.ts` (`printHtml()` + `printPdf()`) con `onafterprint` para cleanup

#### Dashboard (mejora post-Fase 6)
- **4 endpoints agrupados:** `sales-summary`, `dte-summary`, `catalog`, `trends` (vs 1 monolito original)
- **Gráficos recharts:** PieChart (dona) para ventas por tipo + BarChart para ventas mensuales
- **Layout responsive profesional:** 7 cards en fila 1 (Ventas, Compras, Catálogo×3, DTE, Impuestos, Ganancias), stock bajo + gráficos en fila 2, top productos + recientes en fila 3
- **Datos demo:** Seeder `20260716002303-datos-demo.cjs` con 12 artículos, 8 personas, 5 compras, 10 ventas
- **Cada card con su propio fetch y loader** (independientes)

**✅ Criterio de éxito:** Ventas funcionales con 3 tipos de comprobante, DTE certificado contra SAT test, PDF profesional descargable, anulación con reversión de stock + DTE, dashboard con métricas reales, datos demo en BD.

---

### 🔷 FASE 7 — REPORTES ✅ COMPLETADA

**Objetivo:** Migrar la reportería del legacy con una arquitectura limpia, escalable y profesional. Un solo item en el menú lateral que lleva a una página con tabs.

> ⚡ **Arquitectura:** No se mezcla con historiales (SaleList/PurchaseList). Los reportes son **solo lectura, datos agregados, con filtros y exportación**.

#### Diseño final

```
📋 Reportes (menú lateral)
  └── ReportPage.tsx
      ├── Segmented: Ventas | Compras | DTE | Ctas vs Vtas | Stock Mínimo | Más Vendidos | Inventario | 📊 Resumen
      │
      ├── [Ventas]
      │   ├── Filtros: DatePicker.RangePicker + Select cliente + Tipo (Factura/Ticket/Boleta)
      │   ├── Table con sorter en todas las columnas
      │   ├── Footer: suma total del período
      │   └── Export: PDF (rojo) | Excel (verde)
      │
      ├── [Compras]
      │   ├── Filtros: DatePicker.RangePicker + Select proveedor
      │   ├── Table con sorter
      │   └── Export: PDF | Excel
      │
      ├── [DTE]
      │   ├── Filtros: DatePicker.RangePicker + Select cliente
      │   └── Export: PDF | Excel
      │
      ├── [Ctas vs Vtas]
      │   ├── Select año + BarChart
      │   └── Export: PDF | Excel
      │
      ├── [Stock Mínimo]
      │   ├── Input threshold + Select categoría
      │   └── Export: PDF | Excel
      │
      ├── [Más Vendidos]
      │   ├── Filtros: fechas + categoría
      │   ├── Table: cantidad, ventas, total
      │   └── Export: PDF | Excel
      │
      ├── [Inventario]
      │   ├── Filtro Stock >= (default 0 = todos) + categoría
      │   ├── Table: código, producto, stock, precio
      │   └── Export: PDF | Excel
      │
      └── [Resumen] ← Excel multi-hoja + vista previa en frontend
          ├── Selector: Este mes | Mes anterior | Este año | Año anterior | Rango (max 1 año)
          ├── KPI Cards: Ventas, Compras, Ganancia (con % margen), IVA Facturas
          ├── Desglose: Facturas / Tickets / Boletas
          ├── Métricas: Documentos emitidos, Prom. Venta, Prom. Compra, IVA/Ventas%
          ├── Tabla mensual: comparativa mes a mes
          └── Botón: Excel completo (4 hojas: Ventas, Compras, DTE, Resumen)

  Componentes (separados):
    components/reports/
      ├── ReportFilters.tsx       ← Filtros compartidos (fechas, selects, tipo, categoría, stock)
      ├── ReportTable.tsx         ← Table genérica con Spin, sorter, paginación, footer
      ├── ReportExport.tsx        ← Botones PDF (rojo) / Excel (verde)
      └── ReportCharts.tsx        ← BarChart recharts (compras vs ventas)

  Hooks:
    hooks/useReport.ts            ← Fetch con endpoint + params
    hooks/usePersonas.ts          ← Personas por tipo (Cliente/Proveedor)
```

#### Backend

| Paso | Acción | Estado |
|------|--------|--------|
| 7.1 | Instalar `exceljs` + `pdfkit` para generación de archivos | ✅ |
| 7.2 | **ReportsService:** consultas con filtros (ventas, compras, DTE, vs, stock, top, inventario) | ✅ |
| 7.3 | **ReportsExportService:** `toPdf()` + `toExcel()` genéricos con columnas configurables | ✅ |
| 7.4 | **ReportsController:** Endpoints JSON + export unificado `GET /reports/export/:type` | ✅ |
| 7.5 | Ventas por fecha/cliente/tipo | ✅ |
| 7.6 | Compras por fecha/proveedor | ✅ |
| 7.7 | DTE por fecha/cliente | ✅ |
| 7.8 | Compras vs Ventas por año | ✅ |
| 7.9 | Stock mínimo por threshold/categoría | ✅ |
| 7.10 | Top productos por fecha/categoría | ✅ |
| 7.11 | Inventario por categoría/stockMin | ✅ |
| 7.12 | **ComprehensiveReportService:** Excel multi-hoja (Ventas+Compras+DTE+Resumen) + JSON summary | ✅ |
| 7.13 | **ComprehensiveReportService.getSummary():** JSON endpoint para vista previa frontend | ✅ |
| 7.14 | **ComprehensiveReportService.generate():** Excel 4 hojas con queries paralelas | ✅ |
| 7.15 | Ruta `/reports/comprehensive/summary` + `/comprehensive/export` | ✅ |

#### Frontend

| Paso | Acción | Estado |
|------|--------|--------|
| 7.16 | **ReportPage.tsx:** Página con Tabs tipo card + iconos | ✅ |
| 7.17 | **useReport.ts + usePersonas.ts:** Hooks de datos | ✅ |
| 7.18 | **ReportFilters.tsx:** RangePicker, Selects, InputNumber (Stock ≤, Stock >=, Tipo, Categoría) | ✅ |
| 7.19 | **ReportTable.tsx:** Table con Spin, sorter, footer, tableLayout auto | ✅ |
| 7.20 | **ReportExport.tsx:** PDF (rojo) + Excel (verde) con fetch + blob + token JWT | ✅ |
| 7.21 | 7 tabs funcionales (Ventas, Compras, DTE, Vs, Stock, Más Vendidos, Inventario) | ✅ |
| 7.22 | **ComprehensiveReport (Resumen):** KPI cards + desglose + métricas + tabla mensual + Excel | ✅ |
| 7.23 | Export file con `exportFile()`: fetch con auth → blob → blobURL → open/download | ✅ |
| 7.24 | Botones export a la izquierda con colores (PDF rojo, Excel verde) | ✅ |
| 7.25 | Ruta `/reports` registrada | ✅ |

**Principios de diseño:**
- Componentes atómicos: cada tab es independiente
- Export desde backend con exceljs + PDFKit, un solo endpoint `/:type/export`
- Frontend: fetch con JWT → blob → blob URL (sin window.open directo)
- Resumen: vista previa en frontend con cards + Excel descargable multi-hoja

**✅ Criterio de éxito:** Todos los reportes del legacy funcionando en tabs + inventario + top products + resumen completo, exportables a PDF y Excel con autenticación, filtros de fecha/categoría/tipo. Resumen con previsualización en cards y Excel 4 hojas.

---

### 🔷 FASE 8 — ANALÍTICAS 🚀 COMPLETADA

**Objetivo:** Dashboard completo de analíticas de negocio con comparaciones período vs período, gráficos profesionales y métricas clave. Accesible desde el menú lateral como un módulo independiente.

> ⚡ **Arquitectura:** Servicio independiente `AnalyticsService` + controlador `AnalyticsController`. No se mezcla con reportes (son lectura de datos agregados vs analítica comparativa). 10 endpoints paralelos desde el frontend.

#### Diseño

```
📈 Analíticas (menú lateral)
  └── AnalyticsPage.tsx
      ├── Selector período: Hoy | Esta semana | Semana anterior | Este mes | Mes anterior
      │                       | Este trimestre | Este año | Año anterior | Rango (max 1 año)
      │
      ├── Fila 1 — KPI Cards (5) con flecha vs período anterior
      │   ├── Ventas (↑Qxxx / ↓Qxxx)
      │   ├── Compras
      │   ├── Ganancia (con % margen)
      │   ├── Documentos
      │   └── IVA Facturas
      │
      ├── Fila 2 — [Tendencia (diaria o mensual según período)] [Top 5 Productos + Por Tipo] [Top 5 Clientes]
      │
      ├── Fila 3 — [Ventas por Día de Semana] [Ventas por Categoría (%)] [Ventas por Hora]
      │
      └── Fila 4 — [Comparación Día a Día vs Período Anterior] [Tendencia Mensual (líneas ventas vs compras)]
```

#### Backend

| Endpoint | Descripción |
|---|---|
| `GET /analytics/overview?period=` | KPIs + comparación vs período anterior (% cambio) |
| `GET /analytics/daily?period=` | Ventas por día (para chart de tendencia) |
| `GET /analytics/top-products?period=&limit=10` | Top productos más vendidos |
| `GET /analytics/sales-by-type?period=` | Ventas por tipo (Factura/Ticket/Boleta) |
| `GET /analytics/category-breakdown?period=` | Ventas por categoría de producto |
| `GET /analytics/day-of-week?period=` | Ventas por día de la semana |
| `GET /analytics/monthly-trend?from=&to=` | Tendencia mensual (ventas + compras) |
| `GET /analytics/top-clients?period=&limit=5` | Clientes que más compran |
| `GET /analytics/daily-comparison?period=` | Comparación día a día vs período anterior |
| `GET /analytics/hourly?period=` | Distribución por hora del día |

#### Frontend — Componentes

```
components/analytics/
├── PeriodSelector.tsx           ← Selector de período con RangePicker (max 1 año)
├── AnalyticsKPIs.tsx            ← KPI cards con indicador ↑ verde / ↓ rojo
├── DailyComparisonChart.tsx     ← Barras agrupadas: actual vs anterior
├── DayOfWeekChart.tsx           ← Barras coloridas por día
├── CategoryBreakdown.tsx        ← Lista con tags + % del total
├── TopClients.tsx               ← Top 5 clientes con total y compras
```

**✅ Criterio de éxito:** Dashboard de analíticas con datos reales, comparaciones período vs período, 7 tipos de gráficas, responsive, 10 endpoints con queries paralelas, sidebar con icono RiseOutlined.

---

### 🔷 FASE 9 — EXPORTACIÓN PDF (mejora) 🟡 PARCIAL — ver Fase 6 + 7

**Objetivo:** Generar PDFs de facturas, tickets y reportes.

> ⚡ **Nota:** La exportación PDF de **Boleta** y **Factura** ya está implementada en Fase 6 usando PDFKit. La exportación PDF de reportes está implementada en Fase 7. Queda pendiente la exportación de comprobantes de compra.

| Paso | Acción | Estado |
|------|--------|--------|
| 9.1 | Evaluar librería para PDF en Node.js → **PDFKit seleccionado** | ✅ |
| 9.2 | **Boleta PDF:** Plantilla profesional con logo, tabla, totales, firma (A4) | ✅ (Fase 6) |
| 9.3 | **Ticket:** HTML print via iframe oculto (`printUtils.ts`) | ✅ |
| 9.4 | **Factura PDF:** Sirve PDF del DTE (`sat_facturas.pdf_path`) | ✅ (Fase 6) |
| 9.5 | **Reportes PDF:** Todos los reportes exportables a PDF desde backend | ✅ (Fase 7) |
| 9.6 | **Reportes Excel:** Todos los reportes exportables a Excel | ✅ (Fase 7) |
| 9.7 | **Purchase PDF:** Comprobante de ingreso descargable | 🟡 Pendiente |
| 9.8 | **Resumen Excel multi-hoja:** 4 hojas (Ventas, Compras, DTE, Resumen) | ✅ (Fase 7) |

---

## 🔄 MEJORAS RESPECTO AL SISTEMA LEGACY

| Aspecto | Legacy (PHP) | Nuevo (Node + React) |
|---------|-------------|----------------------|
| **SQL Injection** | ❌ Concatenación directa | ✅ Sequelize ORM (parametrized queries) |
| **Autenticación** | Sesión PHP | ✅ JWT Bearer Token |
| **Contraseñas** | Hash básico | ✅ bcrypt + JWT con expiración |
| **API** | HTML + JSON mezclados | ✅ REST puro, siempre JSON |
| **Frontend** | jQuery + AdminLTE 2 | ✅ React + Ant Design 6.5.1 |
| **BD versionada** | ❌ Schema manual | ✅ Sequelize migrations |
| **Manejo de errores** | Mensajes sueltos | ✅ Excepciones uniformes + HTTP codes |
| **Validación** | Manual en cada endpoint | ✅ express-validator + DTOs |
| **Inyección de dependencias** | ❌ No | ✅ Awilix |
| **Subida de archivos** | move_uploaded_file | ✅ multer |
| **Separación de capas** | Parcial (MVC artesanal) | ✅ Controller → Service → Entity |
| **Tipado** | ❌ PHP sin tipos | ✅ TypeScript estricto |
| **Imágenes** | Validación manual | ✅ multer + validación por extensión/tamaño |
| **Paginación** | Manual (limit/offset) | ✅ Sequelize paginate + Ant Design Table |
| **Stock vía triggers** | Triggers MySQL invisibles | ✅ Control explícito en Service Layer con transacciones |
| **Bitácora de logs** | Tabla `bitacora_logs` sin uso | ✅ Integración opcional como middleware de auditoría |
| **Nombres de tablas** | Nombres originales en español | ✅ Se mantienen **exactamente igual** — sin backfill ni riesgos |

---

## 📐 BASE DE DATOS — Migraciones con Sequelize

Usaremos **Sequelize CLI** para gestionar migraciones versionadas.

> ⚠️ **Las tablas mantienen su nombre original** (`usuario`, `articulo`, `venta`, etc.). Las migraciones solo se usarán para:
> - Crear la BD local desde cero en desarrollo (`CREATE DATABASE IF NOT EXISTS`)
> - Versionar cambios futuros en el esquema
> - En producción, los modelos Sequelize apuntan a las tablas existentes sin modificarlas

### Setup

```bash
cd api
npx sequelize-cli init
```

Esto creará:
```
api/
├── database/
│   ├── migrations/       → Migraciones (versiones)
│   └── seeders/          → Datos semilla
└── .sequelizerc          → Config de rutas
```

### Config para tablas existentes

Los modelos Sequelize se configuran con `freezeTableName: true` y `timestamps: false` para que apunten exactamente a las tablas legacy sin esperar columnas `createdAt`/`updatedAt`:

```typescript
sequelize.define('Usuario', {
  idusuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: DataTypes.STRING,
  // ... mismas columnas, mismos nombres
}, {
  tableName: 'usuario',        ← mismo nombre exacto
  freezeTableName: true,       ← no pluralizar
  timestamps: false            ← no esperar createdAt/updatedAt
});
```

### Flujo de trabajo

```bash
# Todas las migraciones desde cero (útil para entorno local)
npm run db:reset

# Crear una migración nueva (para cambios futuros)
npm run migration:generate --name agregar-columna-precio

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:undo

# Seeders (permisos, usuario admin)
npm run seed:run
```

### Scripts en package.json

```json
{
  "scripts": {
    "migration:generate": "node ./node_modules/sequelize-cli/lib/sequelize migration:generate --name",
    "migration:run": "node ./node_modules/sequelize-cli/lib/sequelize db:migrate",
    "migration:undo": "node ./node_modules/sequelize-cli/lib/sequelize db:migrate:undo",
    "seed:run": "node ./node_modules/sequelize-cli/lib/sequelize db:seed:all",
    "db:reset": "node ./node_modules/sequelize-cli/lib/sequelize db:migrate:undo:all && node ./node_modules/sequelize-cli/lib/sequelize db:migrate && node ./node_modules/sequelize-cli/lib/sequelize db:seed:all"
  }
}
```

> Las migraciones usan archivos **`.cjs`** (CommonJS) porque Sequelize CLI las ejecuta directamente con Node.js, sin pasar por TypeScript. No es código que se edite en el día a día — se generan una vez y se ejecutan.

### Migraciones existentes (Fase 1)

| Archivo | Crea |
|---------|------|
| `database/migrations/20260716002251-create-permiso.cjs` | Tabla `permiso` |
| `database/migrations/20260716002252-create-usuario.cjs` | Tabla `usuario` (con unique en `login`) |
| `database/migrations/20260716002253-create-usuario-permiso.cjs` | Tabla `usuario_permiso` (con FK) |
| `database/seeders/20260716002301-permisos-iniciales.cjs` | 8 permisos base (ventas, compras, etc.) |
| `database/seeders/20260716002302-usuario-admin.cjs` | Admin con todos los permisos (bcrypt) |

> Para **entornos con datos existentes** (producción): Las migraciones detectan que las tablas ya existen y no las duplican. Pueden ejecutarse sin riesgo.

---

## 📌 ESQUEMA COMPLETO DE BASE DE DATOS (New Horizon)

```
Servidor: localhost:3306 | Motor: MySQL 8.0 / MariaDB 10.4 | DB: pos_db
```

### ⚠️ Regla importante: MISMOS NOMBRES DE TABLA

Para evitar backfill y riesgos, **los modelos Sequelize usarán exactamente los mismos nombres de tabla que el sistema legacy**. La migración es de código, no de esquema — la BD se queda igual.

| # | Tabla (exacta) | Columnas clave | FK | Módulo |
|---|----------------|----------------|----|--------|
| 1 | `usuario` | idusuario, nombre, tipo_documento, num_documento, direccion, telefono, email, cargo, login, clave(sha256), imagen, condicion | — | Auth/Users |
| 2 | `permiso` | idpermiso, nombre | — | Auth/Users |
| 3 | `usuario_permiso` | idusuario_permiso, idusuario, idpermiso | usuario, permiso | Auth/Users |
| 4 | `categoria` | idcategoria, nombre (UNIQUE), descripcion, condicion | — | Categories |
| 5 | `articulo` | idarticulo, idcategoria, codigo, nombre (UNIQUE), stock, descripcion, imagen, condicion | categoria | Articles |
| 6 | `persona` | idpersona, tipo_persona('Cliente'\|'Proveedor'), nombre, tipo_documento, num_documento, direccion, telefono, email | — | Persons |
| 7 | `ingreso` | idingreso, idproveedor, idusuario, tipo_comprobante, serie_comprobante, num_comprobante, fecha_hora, impuesto, total_compra, estado('Aceptado'\|'Anulado'), tipo_ingreso('CA') | persona, usuario | Purchases |
| 8 | `detalle_ingreso` | iddetalle_ingreso, idingreso, idarticulo, cantidad, precio_compra, precio_venta | ingreso, articulo | Purchases |
| 9 | `venta` | idventa, idcliente, idusuario, tipo_comprobante('Factura'\|'Ticket'), serie_comprobante, num_comprobante, fecha_hora, impuesto, total_venta, estado('Aceptado'\|'Anulado'), tipo_venta('CA') | persona, usuario | Sales |
| 10 | `detalle_venta` | iddetalle_venta, idventa, idarticulo, cantidad, precio_venta, descuento | venta, articulo | Sales |
| 11 | `token_dte` | id_token, token(TEXT), expira_en(DATE), otorgado_a | — | DTE |
| 12 | `sat_facturas` | idfactura, idventa, estado(0=activo,1=anulado), AcuseReciboSAT, autorizacion, serie, numero, fecha_dt, nit_eface, nombre_eface, nit_comprador, nombre_comprador, backprocesor, fecha_certificacion, ResponseDATA1(LONGTEXT), ResponseDATA2(LONGTEXT), ResponseDATA3(TEXT→rutaPDF), total, impuesto | venta | DTE |
| 13 | `bitacora_logs` | idbitacora, log_text(TEXT), log_action, fecha_creacion | — | Shared |

### 🔄 Triggers de MySQL (deben migrarse a la capa de servicios)

```sql
-- Trigger: Al insertar detalle_ingreso → SUMA stock
CREATE TRIGGER tr_updStockIngreso AFTER INSERT ON detalle_ingreso
  UPDATE articulo SET stock = stock + NEW.cantidad WHERE idarticulo = NEW.idarticulo;

-- Trigger: Al insertar detalle_venta → RESTA stock
CREATE TRIGGER tr_updStockVenta AFTER INSERT ON detalle_venta
  UPDATE articulo SET stock = stock - NEW.cantidad WHERE idarticulo = NEW.idarticulo;
```

> ⚠️ **En la nueva arquitectura**, estos triggers se manejarán en el **service layer** (PurchaseService.create() y SaleService.create()) usando transacciones Sequelize, no en BD. Esto da más control y visibilidad.

### 👁️ Vista existente (migrar a consulta Sequelize)

```sql
CREATE VIEW COMPRASVSVENTAS AS
SELECT ... -- FULL OUTER JOIN emulado con UNION entre ventas e ingresos agrupados por mes/año
```
Esta vista se migrará como una consulta en **DashboardService** o **ReportService** usando Sequelize, no como vista en BD.

---

## 🗓️ ORDEN DE EJECUCIÓN RECOMENDADO

```
FASE 0 ── Setup infraestructura                  ✅ COMPLETADA
FASE 1 ── Auth + Dashboard                       ✅ COMPLETADA
FASE 2 ── Categorías + Artículos                 ✅ COMPLETADA
FASE 3 ── Clientes + Proveedores                 ✅ COMPLETADA
FASE 4 ── Usuarios + Permisos                    ✅ COMPLETADA
FASE 5 ── Compras (ingresos + stock)             ✅ COMPLETADA
FASE 6 ── Ventas + DTE + Dashboard               ✅ COMPLETADA
FASE 7 ── Reportes (tabs + export PDF/Excel)    ✅ COMPLETADA
FASE 8 ── Analíticas (dashboard negocio)        ✅ COMPLETADA
FASE 9 ── Exportación PDF (mejora)              🟡 PARCIAL (Faltan compras)
```

> ⚠️ **Nota:** Las fases pueden ejecutarse en paralelo si trabajan personas distintas en backend y frontend. La dependencia real es: Fase 0 → Fase 1 → (2,3,4 en paralelo) → 5 → 6 → 7 → 8.

---

## 🎯 PRINCIPIO DE UX — MEJORA CONTINUA

> La experiencia de usuario del frontend debe ser **significativamente mejor** que el sistema legacy, especialmente en los flujos críticos de ventas y compras. Estas mejoras se implementarán **sobre la marcha** durante cada fase, no como un entregable aparte.

### Reglas de estilo obligatorias

1. **📱 100% Responsive** — Cada página debe funcionar correctamente en escritorio, tablet y móvil. Usar los breakpoints de Ant Design (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`) en `Row`, `Col`, `Grid`. No hay versión "solo escritorio".

2. **🎨 Solo Ant Design** — No se agregan librerías de componentes adicionales. Ant Design 6.5.1 proporciona: `Table`, `Form`, `Modal`, `Drawer`, `Select`, `DatePicker`, `Button`, `Card`, `Layout`, `Menu`, `notification`, `Spin`, `Upload`, `Tabs`, `Collapse`, `Badge`, `Tag`, `Progress`, `Steps`, `Descriptions`, `Statistic`, etc. Es suficiente para todo el sistema.

3. **🎯 UX sobre estética** — Priorizar que los flujos sean rápidos e intuitivos (búsqueda instantánea, atajos de teclado, confirmaciones claras). La estética es consecuencia de un buen diseño funcional.

4. **🔄 Loading states en todas las operaciones** — Toda llamada a la API debe mostrar feedback visual (`Spin`, `loading` en botones, esqueletos).

### Áreas clave de mejora

| Área | Legacy (PHP + jQuery) | Nuevo (React + Ant Design) |
|------|----------------------|----------------------------|
| **Búsqueda de artículos** | Select HTML básico | `Select` con búsqueda, scroll infinito, imagen miniatura, stock visible |
| **Pantalla de venta (POS)** | Formulario con tabla HTML plana | Layout tipo POS con catálogo visual, carrito lateral, totales en tiempo real |
| **Agregar productos rápido** | Modal con DataTables | Drawer/buscador con búsqueda instantánea + resultados en cards |
| **Stock en tiempo real** | Solo al guardar | Visible en cada línea del carrito, alerta si se excede |
| **Clientes** | Select numérico + popup para crear | Select con búsqueda + modal inline para crear rápido |
| **Proveedores** | Similar a clientes | Misma experiencia optimizada |
| **Descuentos** | Campo numérico manual | Input con porcentaje o monto, cálculo automático del total |
| **Tipos de comprobante** | Radio buttons | Select visual con descripción (Factura → DTE, Ticket → simple) |
| **Feedback visual** | Mensajes planos | Notificaciones, loading states, animaciones suaves |
| **Responsive** | Parcial (AdminLTE) | Total (Ant Design responsive) |

---

## 💡 SUGERENCIAS ADICIONALES

1. **Mantener BD legacy funcional durante la migración** — La nueva app puede apuntar a la misma BD (`pos_db`) mientras se migra, usando los mismos nombres de tabla. Luego se renombran las tablas legacy.

2. **No uses `sharp` si no necesitas procesar imágenes** — Para subida simple de imágenes, `multer` + validación de extensión es suficiente.

3. **Ant Design 6.5.1 ya tiene todo lo que necesitas**:
   - `Table` → reemplaza DataTables
   - `Modal` + `Form` → modales CRUD
   - `message` / `notification` → reemplaza SweetAlert
   - `Spin` → loading states
   - `Charts` (via `@ant-design/charts`) → gráficos del dashboard
   - `Upload` → subida de imágenes

4. **No necesitas socket.io** — El sistema legacy no usa tiempo real, no lo necesitas.

5. **Para el DTE (XML + SAT)** — En Node.js puedes usar template literals para construir el XML (más simple que xml2js). La lógica de `Dte12.php` se traduce 1:1.

6. **Upload de imágenes** — Configura Express para servir archivos estáticos desde `uploads/`:
   ```typescript
   app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
   ```

7. **⚠️ Express 5 vs Express 4** — Express 5.2.1 ya está estable pero `awilix-express` podría tener incompatibilidades. Verificar antes de iniciar. Si hay problemas, usar Express 4.x.

8. **⚠️ react-router-dom v7** — Cambió respecto a v6. Usar v7 solo si estamos seguros de la migración; si no, fijar versión 6.x.

¿Listo para arrancar con la **Fase 0**? 🚀
