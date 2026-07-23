# 🔧 Backend — Documentación Técnica

> **Carpeta:** `FACTURACION/api/`  
> **Entry point:** `src/app.ts` → `src/server.ts`  
> **Puerto:** 3000 (por defecto)  
> **Formato de respuesta:** Siempre JSON: `{ ok: boolean, message?: string, data?: any }`

---

## 📦 Dependencias Principales

```json
{
  "express": "^5.2.1",
  "awilix": "^13.0.5",
  "awilix-express": "^11.0.1",
  "sequelize": "^6.37.8",
  "mysql2": "^3.23.0",
  "express-jwt": "^8.5.1",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.3",
  "express-validator": "^7.3.2",
  "exceljs": "^4.4.0",
  "pdfkit": "^0.19.1",
  "multer": "^2.2.0",
  "axios": "^1.18.1",
  "dotenv": "^17.4.2",
  "uuid": "^14.0.1",
  "moment": "^2.30.1"
}
```

---

## 🧩 Arquitectura Interna

### Capas

| Capa | Responsabilidad | Tecnología |
|------|----------------|-----------|
| **Router** | Define rutas HTTP | `awilix-express` decorators (`@route`, `@GET`, `@POST`, etc.) |
| **Controller** | Valida input, llama servicio, responde HTTP | Clase con decoradores, extiende `BaseController` |
| **Middleware** | Autenticación, autorización, validación, contexto multi-tenant | `express-jwt`, `hasPermission()`, `requireSucursal`, `injectRequestContext` (AsyncLocalStorage), `comercioFilter()`, `sucursalFilter()`, `selfFilter()`, `express-validator` |
| **Service** | Lógica de negocio, transacciones, orquestación, filtro por contexto vía `sucursalFilter()` / `comercioFilter()` / `selfFilter()` | Clase inyectada vía Awilix |
| **Model** | Mapeo ORM a tablas MySQL | Sequelize `define()` con `tableName` legacy |
| **DTO** | Interfaces TypeScript para tipado | Archivos planos en `src/dtos/` |

### Entry Point (`app.ts`)

```typescript
// 1. Determina entorno (development por defecto)
process.env.APP_ENV = process.env.APP_ENV || 'development';

// 2. Carga .env según entorno
dotenv.config({ path: `config/${process.env.APP_ENV}.env` });

// 3. Zona horaria Guatemala
process.env.TZ = 'America/Guatemala';

// 4. Arranca servidor
const server = new Server();
server.execute();
```

### Server (`server.ts`)

El server configura en orden:
1. **CORS** — habilitado globalmente
2. **JSON parser** — `express.json()`
3. **Awilix DI** — `loadContainer()` registra todos los servicios
4. **JWT** — `expressjwt` con rutas públicas exceptuadas:
   - `POST /api/auth/login`
   - `POST /api/auth/refresh-token`
   - `GET /uploads/*`
5. **Error handler** — captura `UnauthorizedError` de express-jwt
6. **Request context** — `injectRequestContext` inyecta auth en AsyncLocalStorage (sucursalFilter, getSucursalId, etc.)
7. **Static files** — `/uploads` sirve imágenes de productos y usuarios
8. **Controllers** — `loadControllers('controllers/*.ts')` escanea automáticamente

---

## 📋 Controladores (REST API)

### AuthController — `@route('/auth')`

| Método | Ruta | Auth | Permiso | Descripción |
|--------|------|------|---------|-------------|
| POST | `/auth/login` | ❌ | — | Login con username + password |
| GET | `/auth/me` | ✅ | — | Obtener usuario autenticado (incluye `idrol`, `rol`, `permisos`, `sucursales`) |
| POST | `/auth/refresh-token` | ❌ | — | Rotar refresh token → nuevo access token |
| POST | `/auth/cambiar-sucursal` | ✅ | — | Cambiar sucursal activa, emite nuevo JWT |

### DashboardController — `@route('/dashboard')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/dashboard/sales-summary` | dashboard | Ventas hoy, mes, totales |
| GET | `/dashboard/dte-summary` | dashboard | Facturas DTE del mes, activas, anuladas |
| GET | `/dashboard/catalog` | dashboard | Total categorías, artículos, stock bajo |
| GET | `/dashboard/trends` | dashboard | Ventas mensuales, top productos, últimas ventas |

### CategoryController — `@route('/categories')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/categories` | ventas | Listar todas las categorías activas (para POS) |
| GET | `/categories/all` | inventario | Listar todas (incluyendo inactivas) |
| GET | `/categories/:id` | inventario | Obtener por ID |
| POST | `/categories` | inventario | Crear categoría |
| PUT | `/categories/:id` | inventario | Actualizar categoría |
| DELETE | `/categories/:id` | inventario | Eliminar (desactivar) categoría |

### ArticleController — `@route('/articles')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/articles` | inventario | Listar artículos activos |
| GET | `/articles/all` | inventario | Listar todos (incluyendo inactivos) |
| GET | `/articles/search` | ventas | Búsqueda con paginación (?q=&limit=&offset=&categoryId=) — para POS |
| GET | `/articles/active-for-sale` | ventas | Artículos activos con stock > 0 (para POS) |
| GET | `/articles/:id` | inventario | Obtener por ID |
| GET | `/articles/:id/last-purchase-price` | compras | Último precio de compra |
| POST | `/articles` | inventario | Crear artículo (multipart: imagen) |
| PUT | `/articles/:id` | inventario | Actualizar artículo (multipart: imagen opcional) |
| DELETE | `/articles/:id` | inventario | Desactivar artículo |

> **Upload:** multer con disk storage en `uploads/products/`, UUID filename, 2MB max, extensiones .jpg/.jpeg/.png/.gif/.webp

> **Validaciones:** `precio_venta > 0`, `stock ≥ 0`, `nombre` max 100, `codigo` max 50

### PersonController — `@route('/persons')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/persons/clients` | ventas | Listar clientes |
| GET | `/persons/providers` | compras | Listar proveedores |
| GET | `/persons/:id` | ventas | Obtener por ID |
| POST | `/persons` | ventas | Crear persona (cliente/proveedor) |
| PUT | `/persons/:id` | ventas | Actualizar persona |
| DELETE | `/persons/:id` | ventas | Desactivar persona |

### UserController — `@route('/users')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/users` | usuarios | Listar todos los usuarios |
| GET | `/users/:id` | usuarios | Obtener por ID |
| GET | `/users/:id/permissions` | usuarios | Obtener permisos de un usuario |
| POST | `/users` | usuarios | Crear usuario (multipart: foto + idrol + sucursales[]) — sucursales[] requerido (mín 1), validado en controlador con ApplicationException |
| PUT | `/users/:id` | usuarios | Actualizar usuario — sincroniza sucursales[] si se envía |
| PUT | `/users/:id/password` | usuarios | Cambiar contraseña |
| PUT | `/users/:id/toggle-status` | usuarios | Activar/desactivar usuario |

### ComercioController — `@route('/comercio')`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/comercio/info/:slug` | ❌ Público | Info de branding del comercio (nombre, logo, color) |

### ComercioCrudController — `@route('/comercios')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/comercios` | usuarios | Listar comercios |
| GET | `/comercios/:id` | usuarios | Obtener comercio |
| POST | `/comercios` | usuarios | Crear comercio |
| PUT | `/comercios/:id` | usuarios | Actualizar comercio |
| DELETE | `/comercios/:id` | usuarios | Desactivar comercio |
| PUT | `/comercios/me` | usuarios | Actualizar comercio propio (multipart: nombre, dirección, teléfono, **logo**) — multer file upload, usa `auth.idcomercio` del JWT |

### SucursalController — `@route('/sucursales')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/sucursales` | usuarios | Listar sucursales del comercio activo |
| GET | `/sucursales/:id` | usuarios | Obtener sucursal (con config FEL) |
| POST | `/sucursales` | usuarios | Crear sucursal |
| PUT | `/sucursales/:id` | usuarios | Actualizar sucursal |
| DELETE | `/sucursales/:id` | usuarios | Desactivar sucursal |

### PermissionController — `@route('/permissions')`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/permissions` | Listar catálogo de permisos (7 módulos) |

### ProfileController — `@route('/profile')`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/profile` | Obtener perfil del usuario autenticado |
| PUT | `/profile` | Actualizar perfil (multipart: foto) |
| PUT | `/profile/change-password` | Cambiar contraseña propia |

### PurchaseController — `@route('/purchases')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/purchases` | compras | Listar compras |
| GET | `/purchases/paginated?page=&pageSize=&estado=` | compras | Paginado — `estado` opcional: `Todas` (default), `Aceptado`, `Anulado` |
| GET | `/purchases/:id` | compras | Obtener compra con detalle |
| POST | `/purchases` | compras | Crear compra (transaccional, actualiza stock) — valida `precio_compra > 0`, `cantidad ≥ 1`, `precio_venta ≥ 0` |
| PUT | `/purchases/:id/cancel` | compras | Anular compra — body: `{ motivo_anulacion }` (reversión stock) |

### SaleController — `@route('/sales')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/sales` | ventas | Listar ventas |
| GET | `/sales/:id` | ventas | Obtener venta con detalle |
| POST | `/sales` | ventas | Crear venta (transaccional + DTE si Factura) — valida `precio_venta > 0`, `cantidad ≥ 1`, `descuento ≥ 0` |
| PUT | `/sales/:id/cancel` | ventas | Anular venta (reversión stock + DTE si aplica) — body: `{ motivo_anulacion }` |
| GET | `/sales/:id/pdf` | ventas | Descargar PDF (Boleta/Ticket/Factura) |

> **Nota:** `tipo_venta` acepta `'CA'` (Contado) o `'CR'` (Crédito). Default `'CA'`.

### Paginación

Todos los listados paginados usan el helper `src/common/pagination.ts` y el patrón:

**Backend:** `GET /api/endpoint/paginated?page=1&pageSize=10`

**Respuesta:**
```json
{
  "rows": [...],
  "total": 150,
  "page": 1,
  "pageSize": 10,
  "totalPages": 15
}
```

**Default pageSize:** 10 (configurable vía query param `?pageSize=`)

**Frontend:** `useX().getAllPaginated()` + Ant Design Table con `onChange` para server-side.

| Endpoint | Hook | Lista |
|----------|------|------|
| `GET /sales/paginated` | `useSale().getAllPaginated` | `SaleList` |
| `GET /purchases/paginated` | `usePurchase().getAllPaginated` | `PurchaseList` |
| `GET /articles/paginated` | `useArticle().getAllPaginated` | `ArticleList` |

---

### ReportsController — `@route('/reports')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/reports/sales?from=&to=&cliente=&tipo=&estado=` | reportes-ventas | Ventas — `estado` opcional: `Todas`, `Aceptado` (default), `Anulado` |
| GET | `/reports/purchases?from=&to=&proveedor=&estado=` | reportes-compras | Compras — `estado` opcional: `Todas`, `Aceptado`, `Anulado` |
| GET | `/reports/dte-invoices?from=&to=&cliente=&estado=` | reportes-ventas | Facturas DTE — `estado` opcional: `Todas`, `Activas`, `Anuladas` |
| GET | `/reports/purchases-vs-sales/:year` | dashboard | Comparativo mensual por año |
| GET | `/reports/low-stock?threshold=&categoria=` | reportes | Productos con stock bajo |
| GET | `/reports/top-products?from=&to=&categoria=` | reportes | Productos más vendidos |
| GET | `/reports/inventory?categoria=&stockMin=` | inventario | Inventario con filtros |
| GET | `/reports/export/:type?format=&from=&to=&estado=` | — | Exportar reporte a PDF/Excel (`type`: sales/purchases/dte-invoices). Soportan `estado` |
| GET | `/reports/comprehensive/summary` | reportes | Resumen completo (JSON) |
| GET | `/reports/comprehensive/export` | reportes | Excel multi-hoja (Ventas+Compras+DTE+Resumen) |

### AnalyticsController — `@route('/analytics')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/analytics/overview` | dashboard | KPIs + comparación vs período anterior |
| GET | `/analytics/daily` | dashboard | Ventas por día |
| GET | `/analytics/weekly` | dashboard | Comparación semanal |
| GET | `/analytics/top-products` | dashboard | Top productos |
| GET | `/analytics/sales-by-type` | dashboard | Ventas por tipo comprobante |
| GET | `/analytics/category-breakdown` | dashboard | Ventas por categoría |
| GET | `/analytics/day-of-week` | dashboard | Distribución por día de semana |
| GET | `/analytics/monthly-trend` | dashboard | Tendencia mensual |
| GET | `/analytics/top-clients` | dashboard | Clientes principales |
| GET | `/analytics/daily-comparison` | dashboard | Comparación día a día |
| GET | `/analytics/hourly` | dashboard | Ventas por hora |

> **Parámetro común:** `?period=today|this-week|last-week|this-month|last-month|this-quarter|this-year|custom&from=YYYY-MM-DD&to=YYYY-MM-DD`

### AuditController — `@route('/audit')`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/audit/logs` | usuarios | Bitácora paginada (?page=&tabla=&from=&to=) |
| GET | `/audit/tables` | usuarios | Listar tablas con registros en bitácora |

---

## 💼 Servicios

### AuthService
| Método | Descripción |
|--------|-------------|
| `login(dto)` | Verifica credenciales, determina idsucursal desde usuario_sucursal (primera asignada), retorna `idrol` y `rol` (nombre), genera access + refresh JWT |
| `verifyToken(userId)` | Consulta usuario + permisos + sucursales + **rol** (nombre del rol desde tabla Rol) |
| `refreshAccessToken(refreshToken)` | Verifica refresh y emite nuevo access token |
| `cambiarSucursal(userId, nuevaSucursalId)` | Genera nuevo JWT con la sucursal activa cambiada (sin modificar DB) |
| `getUserSucursales(userId)` | Retorna IDs de sucursales del usuario desde `usuario_sucursal` (N:M) — `timestamps: false` (solo createdAt en la tabla) |
| `getRolePermissions(idrol)` | Retorna nombres de permisos del rol |

### DashboardService
| Método | Descripción |
|--------|-------------|
| `getSalesSummary(userId?)` | Ventas hoy (filtradas por usuario si no es admin) |
| `getDteSummary(userId?)` | Facturas DTE del mes (solo admin) |
| `getCatalog()` | Totales: categorías, artículos, stock bajo |
| `getTrends(userId?)` | Ventas agrupadas por mes, top 10 productos (filtrados por usuario) |

### CategoryService
| Método | Descripción |
|--------|-------------|
| `getAll()` | Categorías activas (condicion = 1) |
| `getAllIncludingInactive()` | Todas las categorías |
| `getById(id)` | Por ID |
| `create(data)` | Crear (nombre único) |
| `update(id, data)` | Actualizar |
| `delete(id)` | Desactivar (condicion = 0) |

### ArticleService
| Método | Descripción |
|--------|-------------|
| `getAll()` | Artículos activos con categoría |
| `getAllIncludingInactive()` | Todos |
| `getById(id)` | Por ID |
| `search(q, limit, offset, categoryId?)` | Búsqueda con LIKE en nombre/código + retorna `stockPorSucursal[]` con stock en todas las sucursales (para PriceChecker) |
| `getActiveForSale()` | Activos con stock > 0 |
| `getLastPurchasePrice(id)` | Último precio de compra desde detalle_ingreso |
| `create(data, file?)` | Crear con imagen opcional — si se envía `stock`, crea registro en `articulo_sucursal` con stock inicial en la sucursal activa |
| `update(id, data, file?)` | Actualizar — si se envía `stock`, actualiza/crea `articulo_sucursal` en la sucursal activa |
| `delete(id)` | Desactivar |

### PersonService
| Método | Descripción |
|--------|-------------|
| `getAll(tipo)` | Personas por tipo (Cliente/Proveedor) |
| `getById(id)` | Por ID |
| `create(data)` | Crear (validación único num_documento) |
| `update(id, data)` | Actualizar |
| `delete(id)` | Desactivar |

### UserService
| Método | Descripción |
|--------|-------------|
| `getAll()` | Todos los usuarios |
| `getById(id)` | Por ID |
| `getPermissionsByUser(id)` | Permisos del usuario (vía rol) |
| `create(data, file?)` | Crear con bcrypt + idrol + sucursales[] (requerido, mín 1). Crea registros en `usuario_sucursal`. Fallback a todas las del comercio si no se envían |
| `update(id, data, file?)` | Actualizar — sincroniza usuario_sucursal si se envían sucursales[] |
| `changePassword(id, data)` | Cambiar contraseña |
| `toggleStatus(id, requestingUserId)` | Activar/desactivar (no auto-desactivación) |
| `updateProfile(userId, data, file?)` | Actualizar perfil propio |
| `changeOwnPassword(userId, data)` | Cambiar contraseña propia |

### PurchaseService
| Método | Descripción |
|--------|-------------|
| `getAll()` | Compras con proveedor y usuario |
| `getById(id)` | Compra + detalle + artículos |
| `create(data, userId)` | **Transaccional:** Insertar ingreso + detalles + actualizar stock |
| `cancel(id)` | **Transaccional:** Anular + revertir stock |

### SaleService
| Método | Descripción |
|--------|-------------|
| `getAll()` | Ventas con cliente y usuario |
| `getById(id)` | Venta + detalle + artículos |
| `create(data, userId)` | **Transaccional 2 fases:** (1) Venta+detalle+stock, (2) DTE si Factura |
| `cancel(id)` | **Transaccional:** Anular venta + reversión stock + anulación DTE |

### DteService
| Método | Descripción |
|--------|-------------|
| `getSucursalConfig()` | Carga configuración DTE desde sucursal activa en BD (nit, usuario_digifact, usuario_login, password) + variables de entorno (`DTE_AUTH_URL`, `DTE_CERT_URL_BASE`, `DTE_CANCEL_URL_BASE`). Construye URLs de certificación/anulación dinámicamente reemplazando `{NIT}` y `{USERNAME}` con `usuario_digifact` (corto) |
| `login()` | Obtener token SAT Digifact usando credenciales de la sucursal + `DTE_AUTH_URL` del `.env` |
| `generarXML(venta, detalle, empresa)` | Construir XML DTE según régimen (FACT o FPEQ). Usa template literals |
| `certificar(venta, detalles?)` | Enviar XML a SAT vía HTTPS, recibir autorización con PDF (base64). Registra request/response en `api_request_logs` |
| `anular(idventa)` | Obtener factura DTE de DB y anular ante SAT. Registra request/response en `api_request_logs` |
| `anularPorAutorizacion(autorizacion, nit, total, fecha)` | Rollback compensatorio si DB falla post-certificación. Registra request/response en `api_request_logs` |

> **ℹ️ DTE URLs:** Las URLs base de Digifact se configuran exclusivamente en variables de entorno (`.env`):

> **ℹ️ DTE URLs:** Las URLs base de Digifact se configuran exclusivamente en variables de entorno (`.env`):
> - `DTE_AUTH_URL` → URL completa de autenticación (ej: `https://felgttestaws.digifact.com.gt/dtefel/.../Login`)
> - `DTE_CERT_URL_BASE` → Template de certificación con `{NIT}` y `{USERNAME}` como placeholders
> - `DTE_CANCEL_URL_BASE` → Template de anulación con `{NIT}` y `{USERNAME}` como placeholders
>
> **Dos campos de usuario:** `usuario_digifact` (corto, ej: `PRUEBAS56`) se usa en las URLs de certificación/anulación vía `buildCertUrl()`/`buildCancelUrl()`. `usuario_login` (completo, ej: `GT.000044653948.PRUEBAS56`) se usa exclusivamente para el login API (`Username` en el POST a `DTE_AUTH_URL`). Ambos se almacenan por sucursal en la tabla `sucursal`.

### ApiRequestLogger
| Método | Descripción |
|--------|-------------|
| `log(params)` | Fire-and-forget. Registra petición a API externa en tabla `api_request_logs`. Campos: `idsucursal`, `endpoint`, `requestUrl`, `requestBody`, `responseStatus`, `responseBody`, `success`. Silent fail (no interrumpe el flujo principal) |

> **Endpoints registrados:** `dte-auth` (login Digifact), `dte-certify` (certificación DTE), `dte-cancel` (anulación DTE). El request_body/response_body se truncan a 5000 chars.

### PdfService
| Método | Descripción |
|--------|-------------|
| `generateBoletaPdf(venta, detalle)` | PDF A4 profesional con tabla, totales, firma |
| `printTicket(venta, detalle)` | HTML para impresión térmica |

### ReportsService
| Método | Descripción |
|--------|-------------|
| `getSales(from, to, cliente?, tipo?)` | Ventas filtradas |
| `getPurchases(from, to, proveedor?)` | Compras filtradas |
| `getDteInvoices(from, to, cliente?)` | Facturas DTE filtradas |
| `getPurchasesVsSales(year)` | Comparativa mensual |
| `getLowStock(threshold, categoryId?)` | Stock bajo |
| `getTopProducts(from, to, categoryId?)` | Top productos |
| `getInventory(categoryId?, stockMin?)` | Inventario completo |

### ReportsExportService
| Método | Descripción |
|--------|-------------|
| `toPdf(columns, rows, title)` | Generar PDF con columnas configurables |
| `toExcel(columns, rows, sheetName)` | Generar Excel con columnas configurables |

### ComprehensiveReportService
| Método | Descripción |
|--------|-------------|
| `getSummary(period?)` | KPIs + desglose + tabla mensual (JSON) |
| `generate(period?)` | Excel 4 hojas (Ventas, Compras, DTE, Resumen) |

### AnalyticsService
| Método | Descripción |
|--------|-------------|
| `getOverview(from, to)` | KPIs actuales + comparación período anterior |
| `getDailyTrend(from, to)` | Ventas agrupadas por día |
| `getWeeklyComparison(from, to)` | Comparación semanal |
| `getTopProducts(from, to, limit)` | Productos más vendidos |
| `getSalesByType(from, to)` | Ventas por tipo comprobante |
| `getCategoryBreakdown(from, to)` | Ventas por categoría |
| `getDayOfWeek(from, to)` | Distribución por día de semana |
| `getMonthlyTrend(from, to)` | Tendencia mensual |
| `getTopClients(from, to, limit)` | Clientes principales |
| `getDailyComparison(from, to)` | Comparación día a día vs período anterior |
| `getHourlyDistribution(from, to)` | Ventas por hora del día |

### AuditService
| Método | Descripción |
|--------|-------------|
| `log(usuario, accion, tabla?, registro_id?, detalle?, ip?)` | Registrar evento (instancia) |
| `registrar(...)` | Versión estática (fire-and-forget con .catch) |
| `getAll(page, pageSize, tabla?, from?, to?)` | Consultar bitácora paginada |
| `getTables()` | Listar tablas con registros |

---

## 🗄️ Modelos (Sequelize)

| Modelo | tableName | PK | FK |
|--------|-----------|----|----|
| `Usuario` | `usuario` | idusuario | — |
| `Permiso` | `permiso` | idpermiso | — |
| `UsuarioPermiso` | `usuario_permiso` | idusuario_permiso | idusuario → Usuario, idpermiso → Permiso |
| `Categoria` | `categoria` | idcategoria | — |
| `Articulo` | `articulo` | idarticulo | idcategoria → Categoria |
| `Person` | `persona` | idpersona | — |
| `Ingreso` | `ingreso` | idingreso | idproveedor → Person, idusuario → Usuario |
| `DetalleIngreso` | `detalle_ingreso` | iddetalle_ingreso | idingreso → Ingreso, idarticulo → Articulo |
| `Venta` | `venta` | idventa | idcliente → Person, idusuario → Usuario |
| `DetalleVenta` | `detalle_venta` | iddetalle_venta | idventa → Venta, idarticulo → Articulo |
| `TokenDte` | `token_dte` | id_token | — |
| `SatFactura` | `sat_facturas` | idfactura | idventa → Venta |
| `BitacoraLog` | `bitacora_logs` | idbitacora | — |

> **Nota:** Todos los modelos tienen `timestamps: false` (por defecto en Sequelize instance). Después de la migración `20260719000002` se añadieron columnas `createdAt`/`updatedAt` a las tablas.

---

## 🌍 Variables de Entorno

Cada entorno tiene su propio archivo en `api/config/`:

| Archivo | Uso |
|---------|-----|
| `development.env` | Desarrollo local |
| `staging.env` | Pruebas/Staging |
| `production.env` | Producción |

### Variables principales

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Host de MySQL |
| `DB_PORT` | `3306` | Puerto de MySQL |
| `DB_NAME` | `pos_db` | Nombre de base de datos |
| `DB_USER` | `root` | Usuario de MySQL |
| `DB_PASSWORD` | `""` | Contraseña de MySQL |
| `JWT_SECRET` | `mi-secreto` | Clave secreta para firmar JWT |
| `JWT_REFRESH_SECRET` | `mi-refresh-secreto` | Clave secreta para refresh token |
| `PORT` | `3000` | Puerto del servidor Express |

### Variables de DTE (Digifact / SAT)

| Variable | Ejemplo (desarrollo) | Descripción |
|----------|---------------------|-------------|
| `DTE_AUTH_URL` | `https://felgttestaws.digifact.com.gt/dtefel/.../Login` | URL completa de autenticación Digifact |
| `DTE_CERT_URL_BASE` | `https://felgttestaws.digifact.com.gt/dtefel/.../...?NIT={NIT}&Usuario={USERNAME}` | Template de certificación — `{NIT}` y `{USERNAME}` se reemplazan con datos de la sucursal |
| `DTE_CANCEL_URL_BASE` | `https://felgttestaws.digifact.com.gt/dtefel/.../...?NIT={NIT}&Usuario={USERNAME}` | Template de anulación — mismos placeholders |

> **Seguridad:** Las URLs base están en `.env`, no en la base de datos. Los valores sensibles (NIT, usuario Digifact) se leen por sucursal desde la tabla `sucursal`. `DteService.buildCertUrl()` y `DteService.buildCancelUrl()` combinan ambas fuentes en tiempo real.

---

## 🧪 Scripts Disponibles

```bash
npm run start          # ts-node src/app.ts
npm run start:dev      # tsnd --respawn src/app.ts (hot reload)
npm run build          # tsc
npm run migration:run  # Ejecutar migraciones pendientes
npm run migration:undo # Revertir última migración
npm run seed:run       # Poblar datos iniciales
npm run db:reset       # Revertir todo + migrar + seedear
```

### Makefile (Mac / Linux)

```bash
make dev         # Inicia servidor con hot reload
make build       # Compila TypeScript
make test        # Ejecuta tests
make test-watch  # Tests en modo watch
make test-coverage # Tests con cobertura
make lint        # Verifica tipos (tsc --noEmit)
make migrate     # Migraciones pendientes
make seed        # Seeders
make db-reset    # Reconstruye BD desde cero
make start       # Inicia producción (node dist/app.js)
make help        # Lista todos los comandos
```

> 💡 En Windows instalar `choco install make` o usar los scripts `npm run` equivalentes.

