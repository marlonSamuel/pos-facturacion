# 🎨 Frontend — Documentación Técnica

> **Carpeta:** `FACTURACION/front/`  
> **Stack:** React 19 + Ant Design 6 + TypeScript 6 + Vite  
> **Entry point:** `src/index.tsx` → `src/GeApp.tsx`

---

## 📂 Estructura

```
src/
  api/
    axios.ts              ← Instancia Axios con interceptor JWT
  components/
    shared/
      SideBar.tsx         ← Menú lateral con filtro por permisos + adminOnly
      Header.tsx          ← Header con SucursalSwitcher, nombre comercio, avatar usuario
      Footer.tsx          ← Footer dinámico con nombre del comercio
      SucursalSwitcher.tsx ← Select/Tag de sucursal activa
      PriceChecker.tsx    ← Consulta de precios y stock
    sales/                ← Componentes de venta
    purchases/            ← Componentes de compra
    reports/              ← Componentes de reportes
    dashboard/            ← Componentes de dashboard
  context/
    auth/
      AuthContext.tsx     ← Contexto de autenticación + comercioInfo
      AuthReducer.tsx     ← Reducer con login, logout, setComercioInfo
    sale/SaleContext.tsx  ← Contexto del carrito de ventas
  hooks/                  ← Custom hooks
  interfaces/             ← TypeScript interfaces
  pages/
    auth/LoginPage.tsx    ← Login con branding dinámico del comercio
    sales/MainSale.tsx    ← POS con ticket/boleta dinámico
    comercio/ComercioConfig.tsx ← Configuración del comercio (Admin)
    inventory/            ← CRUD artículos y categorías
    purchases/            ← Compras
    users/                ← Usuarios, roles, perfil
    reports/ReportPage.tsx ← Reportes
    analytics/            ← Analíticas
    dashboard/            ← Dashboard
    audit/                ← Auditoría
```

---

## 🔐 Autenticación y Branding Dinámico

### AuthContext
- `user`, `token`, `logged` — Sesión (user incluye `idrol`, `rol`, `idsucursal`, `sucursales[]`)
- `comercioInfo` — Datos del comercio (`IComercioPublicInfo`) cargados al login y al verificar token
- `cambiarSucursal(id)` — Cambia sucursal activa: llama `/auth/cambiar-sucursal`, guarda nuevo JWT, llama `/auth/me` y actualiza todo el contexto del usuario
- Al cambiar sucursal, el `<Routes>` en `AppRouter.tsx` se remonta (`key={user?.idsucursal}`) forzando a todas las páginas a re-fetch con el nuevo JWT

### IComercioPublicInfo
```typescript
interface IComercioPublicInfo {
  idcomercio: number;
  nombre: string;
  nickname: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo?: string;
  color_primario?: string;
}
```

### Componentes con branding dinámico
| Componente | Dato dinámico |
|------------|---------------|
| **LoginPage** | Nombre, logo, color del comercio vía `getComercioInfo(slug)` |
| **SideBar** | `comercioInfo?.nombre` en el header del menú |
| **Header** | `comercioInfo?.nombre` al lado del SucursalSwitcher |
| **Footer** | `comercioInfo?.nombre` con año actual |
| **Ticket/Boleta** | Nombre, dirección, teléfono desde `comercioInfo` |

---

## 🧩 Menú Lateral (SideBar)

El menú se filtra por:
- `permisos[]` — Permisos del rol del usuario (`user.permisos`)
- `adminOnly: true` — Solo visible para `user.idrol === 1`

Ejemplo de ítem admin-only:
```typescript
{ key: '/comercio-config', icon: <SettingOutlined />, label: 'Config. Comercio', adminOnly: true },
```

---

## � Gestión de Usuarios

### IndexUser — `/users`
- `UserList` — Tabla con columnas: Avatar, ID, Nombre, Documento, Login, Rol, **Sucursales** (tags), Teléfono, Estado, Acciones
- `UserForm` — Modal de creación/edición con:
  - Campos: nombre, tipo_documento, num_documento, login, contraseña, teléfono, email, foto, dirección
  - **Rol** — Select con búsqueda; al seleccionar un rol, muestra panel informativo con los permisos/módulos del rol
  - **Sucursales asignadas** — Select múltiple **requerido** con todas las sucursales del comercio. Debe seleccionar al menos una.
- `ChangePasswordModal` — Modal para cambiar contraseña

### Roles — `/roles`
- CRUD de roles con asignación de permisos
- Cada rol tiene nombre, descripción y array de permisos

---

## �📋 Páginas

### ComercioConfig — `/comercio-config`
Solo Admin. Formulario para actualizar nombre, dirección, teléfono, email y **logo** del comercio.
- Envía `multipart/form-data` via `PUT /comercios/me`
- El logo se sube como archivo de imagen (jpg/png/gif/webp, máx 2MB)
- El logo se almacena en `uploads/comercios/logo-uuid.ext` y se sirve desde `/uploads/comercios/`
- El logo se muestra en Login, Sidebar y Ticket/Boleta

### MainSale — `/pos`
Pantalla de venta POS con:
- Búsqueda de artículos (con stock vía LEFT JOIN a `articulo_sucursal`)
- Carrito de compras
- Ticket/Boleta imprimible con datos dinámicos del comercio
- Factura DTE con certificación SAT

### Listados con sucursal
| Página | Columna agregada |
|--------|------------------|
| SaleList | `Sucursal` (nombre de la sucursal) |
| PurchaseList | `Sucursal` (nombre de la sucursal) |
| UserList | `Sucursales` (tags con nombres) — cada usuario puede tener varias sucursales |

---

## 📦 Servicios API

| Servicio | Archivo | Endpoints principales |
|----------|---------|----------------------|
| `authService` | `services/authService.ts` | login, verifyToken, cambiarSucursal, getComercioInfo |
| `articleService` | `services/articleService.ts` | CRUD artículos, search, getLastPurchasePrice |
| `categoryService` | `services/categoryService.ts` | CRUD categorías |
| `sucursalService` | `services/sucursalService.ts` | getAll sucursales (ISucursalInfo: idsucursal, nombre) |
| `inventoryService` | `services/inventoryService.ts` | getStock, getLowStock |
