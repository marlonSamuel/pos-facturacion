# 🏗️ Plan de Refactorización — Multi-Comercio (Multi-Tenant)

> **Estado:** ✅ Completado  
> **Prioridad:** Alta  
> **Dependencias:** RBAC completado

---

## 🎯 Objetivo

Transformar la plataforma de POS monocomercial a una arquitectura **multi-comercio multi-sucursal** con detección por subdominio, donde cada comercio opera con datos completamente aislados.

---

## 🌐 Arquitectura Multi-Tenant por Subdominio

### Producción

```
new-horizon.misistema.com   → Frontend (Vite/React SPA, mismo build para todos)
super-ferreteria.misistema.com → Frontend (mismo build)
api.misistema.com            → Backend (Express)

Frontend:  window.location.hostname → extrae slug → branding pre-login
Login:     no necesita slug (usuario amarrado a comercio en BD)
Post-login: JWT contiene { idcomercio, idsucursal, sucursales[] }
```

### Desarrollo local por puertos

```bash
# Terminal 1 — New Horizon (frontend)
VITE_COMERCIO_SLUG=new-horizon  npx vite --port 5173

# Terminal 2 — Super Ferretería (frontend)
VITE_COMERCIO_SLUG=super-ferreteria  npx vite --port 5174

# Terminal 3 — Backend único (api)
npm run start:dev  # → http://localhost:3000
```

### Flujo completo

```
1. Browser → new-horizon.misistema.com/login
2. Frontend lee hostname → extrae slug "new-horizon"
3. GET /api/comercio/info/new-horizon → { nombre, logo, colores } (público)
4. Usuario login → POST /api/auth/login (sin slug especial)
5. Backend busca usuario → tiene idcomercio → JWT { idcomercio, idsucursal, sucursales }
6. De ahí en adelante, el JWT es la fuente de verdad del tenant
```

> El subdominio SOLO sirve para branding pre-login. El JWT contiene toda la info del tenant para requests autenticados.

---

## 📐 Modelo de Datos

```
comercio ──→ sucursal ──→ venta
                     ──→ ingreso
                     ──→ articulo
                     ──→ categoria
                     ──→ persona
          ──→ usuario
          ──→ usuario_sucursal (N:M acceso a sucursales)
```

---

## 🧱 Tablas

### `comercio` (nueva)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| idcomercio | INT PK AUTO_INCREMENT | ID único |
| nombre | VARCHAR(100) | Razón social |
| nickname | VARCHAR(50) UNIQUE | Slug del subdominio |
| descripcion | TEXT | Descripción del negocio |
| direccion | VARCHAR(150) | Dirección fiscal |
| telefono | VARCHAR(20) | Teléfono |
| email | VARCHAR(50) | Correo |
| logo | VARCHAR(255) | URL del logo |
| color_primario | VARCHAR(7) | Color branding (#1890ff) |
| condicion | TINYINT(1) | 1=activo |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### `sucursal` (nueva) — Incluye configuración FEL

| Columna | Tipo | Descripción |
|---------|------|-------------|
| idsucursal | INT PK AUTO_INCREMENT | ID único |
| idcomercio | INT NOT NULL | → comercio(idcomercio) |
| codigo | VARCHAR(10) | Código corto (MATRIZ, SUC01) |
| nombre | VARCHAR(100) | Nombre de sucursal |
| direccion | VARCHAR(150) | Dirección |
| telefono | VARCHAR(20) | Teléfono |
| condicion | TINYINT(1) | 1=activa |
| nit | VARCHAR(16) | NIT |
| nombre_emisor | VARCHAR(150) | Razón social del emisor |
| nombre_comercial | VARCHAR(100) | Nombre comercial |
| direccion_emisor | VARCHAR(200) | Dirección fiscal del emisor |
| regimen | ENUM('GEN','PEQ') | GEN=12%, PEQ=5% |
| usuario_digifact | VARCHAR(50) | Usuario Digifact |
| password_digifact | VARCHAR(255) | Password Digifact |
| codigo_establecimiento | VARCHAR(4) | Código establecimiento SAT |
| codigo_pos | VARCHAR(4) | Código punto emisión SAT |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### `usuario` (modificada)

| Columna | Cambio |
|---------|--------|
| idcomercio | 🔥 NUEVO INT FK → comercio(idcomercio) NOT NULL |
| idsucursal | 🔥 NUEVO INT FK → sucursal(idsucursal) NULL |

### `usuario_sucursal` (nueva N:M)

| Columna | Tipo | FK |
|---------|------|----|
| idusuario_sucursal | INT PK AUTO_INCREMENT | — |
| idusuario | INT NOT NULL | → usuario(idusuario) CASCADE |
| idsucursal | INT NOT NULL | → sucursal(idsucursal) CASCADE |
| createdAt | DATETIME | |

### Tablas con datos por sucursal (+idsucursal INT NOT NULL DEFAULT 1)

`articulo`, `categoria`, `persona`, `venta`, `ingreso`

---

## 🔐 JWT Payload

```typescript
{
  id: number,           // idusuario
  username: string,     // login
  idrol: number,        // 1=admin global
  idcomercio: number,   // comercio
  idsucursal: number,   // sucursal activa
  sucursales: number[], // todas las accesibles
  permissions: string[],
  rolePermissions: string[]
}
```

---

## 🗺️ Fases — Estado Actual

### ✅ FASE 0 — Migraciones BD + Seeders (Completada)

| Paso | Archivo | Estado |
|------|---------|--------|
| 0.1 | `20260721000001-create-comercio.cjs` | ✅ |
| 0.2 | `20260721000002-create-sucursal.cjs` | ✅ |
| 0.3 | `20260721000003-create-usuario-sucursal.cjs` | ✅ |
| 0.4 | `20260721000004-add-comercio-to-usuario.cjs` | ✅ |
| 0.5 | `20260721000005-add-idsucursal-to-tablas.cjs` | ✅ |
| 0.6 | `20260721000006-comercio-inicial.cjs` | ✅ |
| 0.7 | `20260721000007-migrar-datos-existentes.cjs` | ✅ |

### ✅ FASE 1 — Modelos Sequelize (Completada)

| Paso | Estado |
|------|--------|
| Comercio.ts, Sucursal.ts, UsuarioSucursal.ts | ✅ |
| Actualizar Usuario.ts + Articulo, Categoria, Persona, Venta, Ingreso | ✅ |
| Associations.ts (relaciones multi-comercio) | ✅ |

### ✅ FASE 2 — Autenticación (Completada)

| Paso | Estado |
|------|--------|
| AuthService: JWT con idcomercio, idsucursal, sucursales[] | ✅ |
| AuthRequest + middleware requireSucursal | ✅ |
| AsyncLocalStorage request-context + sucursalFilter | ✅ |
| Endpoint POST /auth/cambiar-sucursal | ✅ |
| Endpoint público GET /comercio/info/:slug | ✅ |
| Tests auth multi-comercio (14 tests nuevos) | ✅ |

### ✅ FASE 3 — Backend + Aislamiento (Completada)

| Paso | Estado |
|------|--------|
| CRUD ComercioController + ComercioService | ✅ |
| CRUD SucursalController + SucursalService | ✅ |
| UserService: idcomercio + idsucursal al crear usuario | ✅ |
| Filtro idsucursal en TODOS los servicios (15 services) | ✅ |
| DteService: régimen GEN/PEQ desde BD con datos de sucursal | ✅ |
| Filtro por comercio (comercioFilter) en datos maestros | ✅ |
| selfFilter (Vendedor ve solo sus ventas) | ✅ |
| Inventario desacoplado: articulo_sucursal para stock | ✅ |
| 106 tests | ✅ |

### ✅ FASE 4 — Frontend (Completada)

| Paso | Estado |
|------|--------|
| AuthContext: idcomercio, idsucursal, sucursales, comercioInfo | ✅ |
| Branding dinámico pre-login (slug + API) | ✅ |
| SucursalSwitcher en Header | ✅ |
| Sidebar/Header/Footer dinámicos con datos del comercio | ✅ |
| Ticket/Boleta con datos dinámicos del comercio | ✅ |
| Config. Comercio (Admin) — /comercio-config | ✅ |
| Sucursal en listados (ventas, compras, usuarios) | ✅ |

---

## 🧠 AsyncLocalStorage — Contexto Multi-Tenant

En lugar de pasar `auth` como parámetro a cada método de servicio, se implementó `AsyncLocalStorage` (API estable desde Node 12.17):

```
Request → express-jwt → injectRequestContext (AsyncLocalStorage) → Controllers → Services
                                                                                       ↓
                                                                    sucursalFilter() sin parámetros
```

**Archivos clave:**
- `src/common/request-context.ts` — define `IRequestContext`, `requestContext`, `sucursalFilter()`, `getSucursalId()`, `getComercioId()`, `isAdmin()`
- `src/common/middleware/context.middleware.ts` — middleware que inyecta auth al storage

**Uso en servicios:**
```typescript
import { sucursalFilter, getSucursalId } from '../common/request-context';

// Leer — el filtro se agrega automáticamente
const articulos = await Articulo.findAll({ where: { ...sucursalFilter(), condicion: 1 } });

// Crear — idsucursal se asigna desde el contexto del JWT
const data = { idsucursal: getSucursalId(), ...payload };
```

---

## 🧪 Tests

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Tests existentes (RBAC + servicios) | 91 | ✅ Sin cambios |
| Auth middleware (hasPermission + requireSucursal) | 7 | ✅ Nuevos |
| Multi-comercio AuthService | 4 | ✅ Nuevos |
| UserService adaptados | 3 | ✅ Actualizados |
| **Total** | **105** | **✅ Pasando** |

---

## 💡 Régimen FEL

### GEN (General) — Ya funcional
- Tipo: `FACT`, IVA: 12%, TipoFrase: `1`, TotalImpuestos: ✅

### PEQ (Pequeño Contribuyente) — Nuevo
- Tipo: `FPEQ`, IVA: 5%, TipoFrase: `3`, TotalImpuestos: ❌

---

## 📊 Impacto Final

| Tipo | Cantidad |
|------|----------|
| Migraciones | 5 nuevas |
| Seeders | 2 nuevos |
| Modelos nuevos | Comercio, Sucursal, UsuarioSucursal |
| Modelos modificados | Usuario, Articulo, Categoria, Persona, Venta, Ingreso |
| Servicios nuevos | ComercioService, SucursalService |
| Servicios con filtro sucursal | 15 (Articles, Categories, Persons, Sales, Purchases, Dashboard, Analytics, Reports, ComprehensiveReport, Audit, DTE, User) |
| Middleware nuevos | context.middleware (AsyncLocalStorage), requireSucursal |
| Archivo nuevo core | request-context.ts (AsyncLocalStorage + helpers) |
| Tests | 105 (91 originales + 14 nuevos) |
| Frontend componentes nuevos | SucursalSwitcher |
| Frontend modificados | AuthContext, AuthReducer, IAuth, authService, Header, LoginPage |
