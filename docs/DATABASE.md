# 🗄️ Base de Datos — Esquema y Modelos

> **Motor:** MySQL 8 / MariaDB 10.4  
> **Base:** `pos_db`  
> **ORM:** Sequelize 6 (modelos en `api/src/models/`)

---

## 📊 Esquema Actual

### Tablas Maestras (por comercio — `idcomercio`)

| Tabla | PK | Columnas clave | Filtro |
|-------|----|----------------|--------|
| **comercio** | `idcomercio` | nombre, nickname, direccion, telefono, email, logo, color_primario | — |
| **categoria** | `idcategoria` | nombre, descripcion, condicion, **idcomercio** | `comercioFilter()` |
| **articulo** | `idarticulo` | idcategoria, codigo, nombre, descripcion, precio_venta, condicion, **idcomercio** | `comercioFilter()` |
| **persona** | `idpersona` | tipo_persona, nombre, num_documento, direccion, telefono, email, **idcomercio** | `comercioFilter()` |

### Tablas de Inventario (por sucursal)

| Tabla | PK | Columnas clave |
|-------|----|----------------|
| **articulo_sucursal** | `id` | **idarticulo** (FK), **idsucursal** (FK), **stock** — UNIQUE(idarticulo, idsucursal) |

> `articulo_sucursal` separa la definición del producto (en `articulo`) de su stock por sucursal.

### Tablas Transaccionales (por sucursal — `idsucursal`)

| Tabla | PK | Columnas clave |
|-------|----|----------------|
| **venta** | `idventa` | idcliente, idusuario, tipo_comprobante, serie, numero, fecha_hora, total_venta, estado, **idsucursal**, motivo_anulacion VARCHAR(100) NULL |
| **detalle_venta** | `iddetalle_venta` | idventa (FK), idarticulo (FK), cantidad, precio_venta, descuento |
| **ingreso** | `idingreso` | idproveedor, idusuario, tipo_comprobante, serie, numero, fecha_hora, total_compra, estado, **idsucursal**, motivo_anulacion VARCHAR(100) NULL |
| **detalle_ingreso** | `iddetalle_ingreso` | idingreso (FK), idarticulo (FK), cantidad, precio_compra, precio_venta |

### Tablas de Usuarios y Roles

| Tabla | PK | Columnas clave |
|-------|----|----------------|
| **usuario** | `idusuario` | nombre, login, clave, idrol, **idcomercio** (FK) — _idsucursal eliminada, ahora N:M vía usuario_sucursal_ |
| **usuario_sucursal** | `idusuario_sucursal` | idusuario (FK), idsucursal (FK), createdAt — UNIQUE(idusuario, idsucursal) — solo createdAt, sin updatedAt (timestamps: false) |
| **rol** | `idrol` | nombre, descripcion |
| **rol_permiso** | `idrol_permiso` | idrol (FK), idpermiso (FK) |
| **permiso** | `idpermiso` | nombre, descripcion |

### Tablas de Sucursales y DTE

| Tabla | PK | Columnas clave |
|-------|----|----------------|
| **sucursal** | `idsucursal` | idcomercio, codigo, nombre, nit, nombre_emisor, nombre_comercial, direccion_emisor, codigo_postal, municipio, departamento, pais, regimen (GEN/PEQ), **principal** (TINYINT, default 0), codigo_establecimiento, usuario_digifact (corto — para URL), usuario_login (completo — para login API), password_digifact |
| **sat_facturas** | `id` | idventa, autorizacion, serie, numero, total, impuesto, estado |
| **token_dte** | `id_token` | **idsucursal** (INT, NULL — sucursal que generó el token), token, expira_en, otorgado_a |
| **api_request_logs** | `id` | idsucursal, endpoint (dte-auth/certify/cancel), request_url, request_body, response_status, response_body, success (TINYINT), created_at |

---

## 🧠 Helpers de Filtro (request-context.ts)

| Helper | Uso | Admin bypass |
|--------|-----|:---:|
| Helper | Uso | Admin bypass |
|--------|-----|:---:|
| `comercioFilter()` | Datos maestros (categorías, artículos, personas) | ✅ |
| `sucursalFilter()` | Transacciones (ventas, compras, stock) — aplica para **todos** los usuarios, incluyendo admin | ❌ |
| `selfFilter('idusuario')` | Visibilidad propia (Vendedor solo sus ventas) | ✅ |

---

## 🏗️ Migraciones Recientes

| Archivo | Descripción |
|---------|-------------|
| `20260722000001-add-idcomercio-to-master-tablas` | Agrega `idcomercio` a categoria, articulo, persona |
| `20260723000001-create-articulo-sucursal` | Crea `articulo_sucursal`, migra stock, elimina columnas legacy |
| `20260724000001-add-digifact-urls-to-sucursal` | Agrega `auth_url_digifact`, `cert_url_digifact`, `cancel_url_digifact` |
| `20260725000001-add-principal-to-sucursal-drop-usuario-idsucursal` | Agrega `principal` a sucursal, elimina `idsucursal` de usuario, crea `usuario_sucursal` (N:M) |
| `20260726000001-remove-digifact-urls-from-sucursal` | Elimina `auth_url_digifact`, `cert_url_digifact`, `cancel_url_digifact` de sucursal (URLs ahora en `.env` con placeholders `{NIT}`/`{USERNAME}` construidas dinámicamente por `DteService`) |
| `20260726000002-add-usuario-login-to-sucursal` | Agrega `usuario_login` (VARCHAR(100)) a sucursal — usuario completo para login API Digifact (ej: `GT.000044653948.PRUEBAS56`), separado de `usuario_digifact` (corto, ej: `PRUEBAS56`) que se usa en URLs de certificación/anulación |
| `20260726000003-create-api-request-logs` | Crea `api_request_logs` para registrar peticiones a APIs externas (DTE: auth, certify, cancel) con request/response body, status y sucursal |
| — (manual) | Agrega `codigo_postal`, `municipio`, `departamento`, `pais` a `sucursal` |
| — (manual) | Agrega `motivo_anulacion VARCHAR(100) NULL` a `venta` e `ingreso` |
