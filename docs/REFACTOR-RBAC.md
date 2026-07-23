# 🏗️ Plan de Refactorización — Roles y Permisos (RBAC)

> **Estado:** ✅ Completado
> **Prioridad:** Alta  
> **Dependencias:** Ninguna

---

## 🎯 Objetivo

Migrar del modelo anterior (permisos asignados directamente por usuario vía `usuario_permiso`) a un modelo **RBAC** (Role-Based Access Control) donde los permisos se agrupan en roles, y los usuarios heredan permisos del rol asignado. La tabla `usuario_permiso` fue eliminada.

### 🏷️ Renombrado de permisos

Como parte de la refactorización, los permisos se renombran con nombres descriptivos y en español:

| Actual | Problema | Nuevo | Descripción UI |
|--------|----------|-------|----------------|
| `escritorio` | ✅ Genérico | `dashboard` | Dashboard + Analíticas |
| `almacen` | ✅ Legacy | `inventario` | Artículos + Categorías |
| `ventas` | ✅ OK | `ventas` | POS + Historial + Clientes |
| `compras` | ✅ OK | `compras` | Compras + Proveedores |
| `usuarios` | ✅ OK | `usuarios` | Usuarios + Auditoría |
| `consultav` | ❌ Críptico | `reportes-ventas` | Reportes de ventas |
| `consultac` | ❌ Críptico | `reportes-compras` | Reportes de compras |

> Los nombres en BD cambian vía migración (`UPDATE permiso SET nombre = ... WHERE idpermiso = N`).  
> Las relaciones `usuario_permiso` usan `idpermiso` (FK numérica), no el nombre → **no se afectan datos existentes**.

---

## 📐 Modelo Actual vs Propuesto

### Actual (directo)

```
usuario ──→ usuario_permiso ──→ permiso
  (1)           (N)               (1)
```

Cada usuario tiene N registros en `usuario_permiso`. Para cambiar permisos hay que editar cada usuario individualmente.

### Propuesto (RBAC)

```
rol ──→ rol_permiso ──→ permiso
  (1)       (N)          (1)
  │
  └── usuario (N)
```

El usuario apunta a un rol. El rol agrupa permisos. Para cambiar permisos a un grupo de usuarios, solo se actualiza el rol.

---

## 🧱 Estructura de Tablas

### Nueva: `rol`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| idrol | INT PK AUTO_INCREMENT | ID único |
| nombre | VARCHAR(50) UNIQUE | Nombre del rol |
| descripcion | VARCHAR(255) | Descripción opcional |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### Nueva: `rol_permiso`

| Columna | Tipo | FK |
|---------|------|----|
| idrol_permiso | INT PK AUTO_INCREMENT | — |
| idrol | INT | → rol(idrol) |
| idpermiso | INT | → permiso(idpermiso) |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### Modificada: `usuario`

| Columna | Cambio |
|---------|--------|
| idrol | 🔥 NUEVO: INT FK → rol(idrol), nullable (usuarios legacy sin rol) |

### Eliminada: `usuario_permiso`

La tabla `usuario_permiso` fue eliminada (migración `20260720000006-drop-usuario-permiso.cjs`). Ahora los permisos se asignan exclusivamente a través del rol.

---

## 📋 Flujo de permisos (prioridad)

```
1. ¿Usuario es admin (idrol === 1)? → acceso total
2. ¿Tiene permiso vía rol? → OK
3. → 403
```

El middleware `hasPermission()` se modificó para:

```typescript
const hasPermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ ok: false, message: 'No autenticado' });
    if (auth.idrol === 1) return next();

    const allPermissions = [...(auth.rolePermissions || []), ...(auth.permissions || [])];
    if (allPermissions.includes(permission)) return next();

    return res.status(403).json({ ok: false, message: `Sin permiso: ${permission}` });
  };
};
```

El JWT ahora incluye `rolePermissions` + `idrol` además de `permissions`.
La columna `cargo` fue eliminada de la tabla `usuario` (reemplazada por `idrol` → FK a `rol`).

---

## 🗺️ Fases de Implementación

### ✅ FASE 1 — Migración de BD + Modelos (Completada)

| Paso | Acción | Archivos |
|------|--------|----------|
| 1.0 | Migration: renombrar permisos (`consultav`→`reportes-ventas`, etc.) | `database/migrations/XXXX-rename-permisos.cjs` |
| 1.1 | Migration: crear `rol` | `database/migrations/XXXX-create-rol.cjs` |
| 1.2 | Migration: crear `rol_permiso` | `database/migrations/XXXX-create-rol-permiso.cjs` |
| 1.3 | Migration: agregar `idrol` a `usuario` | `database/migrations/XXXX-add-idrol-to-usuario.cjs` |
| 1.4 | Seeder: crear roles por defecto (Admin, Vendedor, Bodeguero, Consulta) | `database/seeders/XXXX-roles-iniciales.cjs` |
| 1.5 | Seeder: asignar rol Admin al usuario 1 | Ídem |
| 1.6 | Modelo Sequelize: `Rol.ts` | `src/models/Rol.ts` |
| 1.7 | Modelo Sequelize: `RolPermiso.ts` | `src/models/RolPermiso.ts` |
| 1.8 | Asociaciones: Rol ↔ RolPermiso ↔ Permiso, Usuario → Rol | `src/models/Associations.ts` |

### ✅ FASE 2 — Backend (Roles CRUD) (Completada)

| Paso | Acción | Archivos |
|------|--------|----------|
| 2.1 | RolController: CRUD de roles con permisos asignados | `src/controllers/RolController.ts` |
| 2.2 | RolService: CRUD + asignación de permisos | `src/services/RolService.ts` |
| 2.3 | Endpoints: `GET/POST/PUT/DELETE /roles` + `GET /roles/:id/permissions` | |
| 2.4 | Modificar UserService.create: recibir `idrol` | `src/services/UserService.ts` |
| 2.5 | Modificar UserController: agregar `idrol` a validaciones | `src/controllers/UserController.ts` |

### ✅ FASE 3 — Modificar Auth (Completada)

| Paso | Acción | Archivos | Estado |
|------|--------|----------|--------|
| 3.1 | AuthService.login: cargar permisos del rol | `src/services/AuthService.ts` | ✅ |
| 3.2 | AuthService: incluir `rolePermissions` en JWT | | ✅ |
| 3.3 | Modificar middleware `hasPermission`: unir rolePermissions + permissions | `src/common/middleware/auth.middleware.ts` | ✅ |
| 3.4 | Actualizar interfaz `AuthRequest` | Ídem | ✅ |
| 3.5 | Modificar refreshToken para incluir nuevos claims | `src/services/AuthService.ts` | ✅ |
| 3.6 | Eliminar tabla `usuario_permiso` | `database/migrations/DROP.cjs` | ✅ |
| 3.7 | Actualizar tests (91/91 pasando) | `__tests__/services/` | ✅ |

### ✅ FASE 4 — Frontend (Gestión de Roles) (Completada)

| Paso | Acción | Archivos | Estado |
|------|--------|----------|--------|
| 4.1 | Página `RolePage` con tabla + modal CRUD | `front/src/pages/roles/RolePage.tsx` | ✅ |
| 4.2 | RoleForm: checkboxes de permisos + nombre rol | `front/src/pages/roles/RoleForm.tsx` | ✅ |
| 4.3 | Modificar UserForm: Select de rol en lugar de checkboxes | `front/src/pages/users/UserForm.tsx` | ✅ |
| 4.4 | Agregar ruta `/roles` en AppRouter y SideBar | `front/src/router/AppRouter.tsx`, `SideBar.tsx` | ✅ |
| 4.5 | Hook `useRole` | `front/src/hooks/useRole.ts` | ✅ |
| 4.6 | Service `roleService.ts` | `front/src/services/roleService.ts` | ✅ |
| 4.7 | Actualizar `useUser`/`IndexUser`: roles en lugar de permisos | `useUser.ts`, `IndexUser.tsx` | ✅ |
| 4.8 | Build frontend: ✅ 0 errores TypeScript, build Vite exitoso | | ✅ |

### ✅ FASE 5 — Datos semilla por defecto (Completada)

| Rol | Permisos | Estado |
|-----|----------|--------|
| **Admin** | Todos (7) | ✅ Sembrado |
| **Vendedor** | `dashboard`, `ventas` | ✅ Sembrado |
| **Bodeguero** | `inventario`, `compras`, `reportes-compras` | ✅ Sembrado |
| **Consulta** | `dashboard`, `reportes-ventas`, `reportes-compras` | ✅ Sembrado |

| Paso | Acción | Estado |
|------|--------|--------|
| 5.1 | Seeders idempotentes (`ignoreDuplicates: true`) | ✅ |
| 5.2 | `usuario-admin.cjs` — sin referencia a `usuario_permiso` | ✅ |
| 5.3 | `roles-iniciales.cjs` — asigna Admin al usuario 1 | ✅ |
| 5.4 | `datos-demo.cjs` — categorías, artículos, personas, compras, ventas | ✅ |
| 5.5 | `db:seed:all` ejecutado exitosamente | ✅ |

---

## 🔄 Compatibilidad hacia atrás

1. `usuario_permiso` fue **eliminada** — migración que asigna rol `Consulta` (idrol=4) a usuarios sin rol antes de dropear la tabla
2. `idrol` es nullable — los usuarios sin rol pueden existir (no tendrán permisos)
3. Los endpoints actuales de usuario (crear/editar) usan `idrol` en lugar de `permisos`

---

## 📊 Impacto

| Archivos nuevos | Archivos modificados |
|----------------|---------------------|
| `Rol.ts`, `RolPermiso.ts` | `usuario` migration |
| `RolController.ts`, `RolService.ts` | `AuthService.ts` |
| `RolePage.tsx`, `RoleForm.tsx` | `auth.middleware.ts` |
| `useRole.ts`, `roleService.ts` | `UserService.ts`, `UserController.ts` |
| 6 migrations + 3 seeders | `UserForm.tsx`, `SideBar.tsx`, `AppRouter.tsx` |
| | `Associations.ts`, `IUser.ts` |
| | `__tests__/services/AuthService.test.ts` |
| | `__tests__/services/UserService.test.ts` |
| | `DashboardService.ts`, `DashboardController.ts` |
| | `AnalyticsController.ts`, `CategoryController.ts` |
| | `ArticleController.ts` |

---

## ✅ Criterio de éxito

- [x] Usuario con rol Vendedor solo ve Dashboard + Ventas + Clientes
- [x] Usuario con rol Admin ve todo
- [x] Se puede crear/editar roles desde el frontend
- [x] Al crear usuario se asigna rol (selector en UserForm)
- [x] Login respeta permisos del rol
- [x] Tabla `usuario_permiso` eliminada
- [x] 91 tests pasando, build frontend exitoso
- [x] Refresh token también incluye permisos del rol
- [x] Migración no rompe datos existentes
- [x] Dashboard filtrado por usuario no-admin
- [x] Columna `cargo` eliminada de BD, backend y frontend
- [x] Vendedor solo ve Dashboard (datos propios) + Ventas
