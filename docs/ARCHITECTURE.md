# 🏗️ Arquitectura del Sistema — New Horizon POS

## Vista General

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (React SPA)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Auth     │ │ POS      │ │ Reports  │ │ Analytics         │  │
│  │ Pages    │ │ Modules  │ │ Modules  │ │ Dashboard         │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬──────────┘  │
│       │            │            │                 │             │
│  ┌────┴────────────┴────────────┴─────────────────┴──────────┐  │
│  │              Axios Instance + JWT Interceptor               │  │
│  └────────────────────────────┬───────────────────────────────┘  │
└───────────────────────────────┼───────────────────────────────────┘
                                │ HTTP/JSON
                                │ Bearer Token
┌───────────────────────────────┼───────────────────────────────────┐
│                   API REST (Express 5) ── :3000                   │
│                                │                                  │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│  │              express-jwt Middleware (JWT validation)         │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│  │    injectRequestContext (AsyncLocalStorage — multi-tenant)   │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│              hasPermission() + requireSucursal (RBAC)           │
│  └────────────────────────────┬───────────────────────────────┘  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                   │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│  │         Awilix DI Container → scopePerRequest                │  │
│  │  (autobinds controllers & injects services via constructor)  │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────┐  │
│  │Controllers│→│ Services  │→│ Sequelize  │→│ MySQL / MariaDB │  │
│  │(routing)  │ │(business) │ │ Models     │ │ pos_db          │  │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────────┘  │
│                                                    │              │
│  ┌─────────────────────────────────────────────────┴──────────┐  │
│  │  SAT Digifact API (SOAP/XML) — Facturación Electrónica DTE  │  │
│  │  HTTPS nativo (no axios) para evitar alteración de XML raw  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Estructura de Carpetas

```
FACTURACION/
│
├── api/                              ← Backend
│   ├── config/                       → development.env, production.env, staging.env
│   ├── src/
│   │   ├── app.ts                    → Entry point: dotenv + Server()
│   │   ├── server.ts                 → Express config: CORS, JWT, DI, static, controllers
│   │   ├── container.ts              → Awilix container: register all services
│   │   ├── common/
│   │   │   ├── base/
│   │   │   │   └── base.controller.ts     ← BaseController.handleException()
│   │   │   ├── database/
│   │   │   │   └── mysql.ts               ← Sequelize instance
│   │   │   ├── errors/
│   │   │   │   └── application.exception.ts  ← Custom error with statusCode
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts      ← AuthRequest interface + hasPermission() + requireSucursal
│   │   │   │   ├── context.middleware.ts   ← AsyncLocalStorage (multi-tenant context)
│   │   │   │   └── validate-fields.ts      ← express-validator result handler
│   │   │   ├── request-context.ts          ← AsyncLocalStorage + sucursalFilter() + helpers
│   │   │   └── helpers.ts                  ← Re-exports from request-context
│   │   ├── controllers/             ← 16 controllers with awilix-express decorators
│   │   ├── services/                ← 17 services with business logic
│   │   ├── models/                  ← 18 Sequelize models + Associations.ts
│   │   └── dtos/                    ← 9 TypeScript interfaces
│   ├── database/
│   │   ├── migrations/              ← Sequelize migrations (.cjs)
│   │   └── seeders/                 ← Initial data (permissions, admin user)
│   ├── uploads/                     ← Static files (products/, users/)
│   └── package.json
│
└── front/                            ← Frontend
    ├── src/
    │   ├── api/
    │   │   └── axios.ts                  ← Axios instance + JWT interceptor + refresh queue
    │   ├── context/
    │   │   ├── auth/
    │   │   │   ├── AuthContext.tsx        ← Auth state provider (multi-comercio + sucursales)
    │   │   │   └── AuthReducer.tsx        ← Auth state reducer (comercioInfo)
    │   │   ├── sale/
    │   │   │   └── SaleContext.tsx        ← Sale cart state
    │   │   ├── shop/
    │   │   │   └── ShopContext.tsx        ← Purchase cart state
    │   │   └── UIContext.tsx             ← Global loading + breadcrumb
    │   ├── hooks/                        ← 10 custom hooks (API layer)
    │   ├── services/                     ← 8 service modules (HTTP calls)
    │   ├── pages/                        ← 11 page modules
    │   ├── components/
    │   │   └── shared/
    │   │       ├── SideBar.tsx           ← Menú dinámico por permisos
    │   │       ├── Header.tsx            ← Barra superior + SucursalSwitcher
    │   │       ├── SucursalSwitcher.tsx  ← Selector de sucursal activa
    │   │       ├── Footer.tsx            ← Pie de página
    │   │       └── PriceChecker.tsx      ← Consulta de precios
    │   ├── router/
    │   │   ├── AppRouter.tsx             ← Main route definitions
    │   │   ├── PrivateRoute.tsx          ← Auth guard
    │   │   └── PublicRoute.tsx           ← Redirect if logged in
    │   ├── interfaces/                   ← TypeScript interfaces
    │   ├── helpers/                      ← Utilities (print, notifications)
    │   └── GeApp.tsx                     ← Root component with providers
    └── package.json
```

---

## 🔄 Flujo de Datos

### 1. Autenticación (Multi-Tenant)
```
Login → POST /api/auth/login → JWT { idcomercio, idsucursal, sucursales[], ... }
  → Frontend almacena en localStorage
  → Cada request lleva Bearer token en header
  → Middleware express-jwt valida token
  → injectRequestContext (AsyncLocalStorage) inyecta auth al contexto global
  → Servicios usan sucursalFilter() sin recibir auth como parámetro
  → 401 → interceptor intenta refresh → si falla, logout
```

### 2. CRUD Estándar
```
Usuario → Page → Hook → Service (axios) → Controller → Service → Sequelize Model → MySQL
  ↓                                                    ↓
  UI update ← Hook state ← Response JSON ← ← ← ← ← ← ←
```

### 3. Venta con DTE (flujo crítico)
```
POS → POST /api/sales → SaleService.create()
  1. Iniciar transacción Sequelize
  2. INSERT venta + detalle_venta
  3. COMMIT
  4. Si es Factura → DteService.login() → generarXML() → certify()
  5. Si DTE ok → UPDATE sat_facturas + UPDATE venta.estado
  6. Si DTE falla → venta NO se crea (transaccional)
  7. Si DTE certifica pero DB falla → DteService.anularPorAutorizacion()
```

### 4. Reportes (Read-only)
```
ReportPage → useReport() → GET /api/reports/sales?from=X&to=Y
  → ReportsController → ReportsService (raw queries con Sequelize)
  → JSON response → ReportTable con sorter + footer
```

### 5. Exportación (PDF/Excel)
```
ReportExport component → GET /api/reports/export/sales?type=pdf
  → ReportsController → ReportsExportService.toPdf() / .toExcel()
  → Binary response → blob → blob URL → download/open
```

---

## 🧠 Patrones de Diseño

### Dependency Injection (Awilix)
```typescript
// container.ts — registro
container.register({
  saleService: asClass(SaleService).scoped(),
  pdfService: asClass(PdfService).scoped(),
});

// Controller — inyección automática por constructor
@route('/sales')
export class SaleController extends BaseController {
  constructor(
    private readonly saleService: SaleService,
    private readonly pdfService: PdfService
  ) { super(); }
}
```

### Transacciones en Service Layer
```typescript
// Compra/Venta — operaciones atómicas
const t = await sequelize.transaction();
try {
  await DetalleIngreso.create({ ... }, { transaction: t });
  await Articulo.increment('stock', { by: cantidad, where: { idarticulo }, transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

### Fire-and-Forget (Auditoría)
```typescript
// No bloquea la respuesta, error se traga con .catch()
AuditService.registrar(username, 'CREAR', 'categoria', id, JSON.stringify(body), req.ip);
// Internamente: Model.create(...).catch(err => console.error(...))
```

### Refresh Token Queue (Frontend)
```typescript
// Múltiples requests 401 simultáneos → solo 1 refresh
// Los demás se encolan y re-intentan con el nuevo token
```

---

## 🗺️ Mapa de Rutas (Frontend)

| Ruta | Página | Permiso Requerido |
|------|--------|-------------------|
| `/auth/login` | LoginPage | Público |
| `/` | DashboardPage | dashboard |
| `/dashboard` | DashboardPage | dashboard |
| `/categories` | IndexCategory | inventario |
| `/products` | IndexArticle | inventario |
| `/clients` | IndexClient | ventas |
| `/providers` | IndexProvider | compras |
| `/users` | IndexUser | usuarios |
| `/profile` | ProfilePage | autenticado |
| `/pos` | MainSale (POS) | ventas |
| `/sales` | IndexSale | ventas |
| `/purchases/new` | MainPurchase | compras |
| `/purchases` | IndexPurchase | compras |
| `/reports` | ReportPage | consultav/consultac/reportes |
| `/analytics` | AnalyticsPage | dashboard |
| `/audit` | AuditPage | usuarios |
