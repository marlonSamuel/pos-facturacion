# 🏪 New Horizon — Sistema de Inventarios y Facturación Electrónica

> **Stack:** Node.js 24 + Express 5 + TypeScript 7 + React 19 + Ant Design 6  
> **Base de datos:** MySQL 8 / MariaDB 10.4 — `pos_db`  
> **Facturación Electrónica:** SAT Digifact (FEL v3) — DTE guatemalteco  
> **Cliente:** New Horizon — Guatemala

---

## 📂 Documentación

| Archivo | Contenido |
|---------|-----------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Visión general del sistema, stack, patrones, estructura de carpetas |
| [`BACKEND.md`](./BACKEND.md) | Documentación completa del backend: controladores, servicios, modelos, rutas API |
| [`FRONTEND.md`](./FRONTEND.md) | Documentación completa del frontend: páginas, componentes, hooks, contextos |
| [`DATABASE.md`](./DATABASE.md) | Esquema de base de datos, modelos, migraciones, triggers legacy |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Instrucciones de despliegue, configuración de entornos, build |
| [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) | Plan de migración desde PHP legacy a Node.js/React |

---

## 🚀 Inicio rápido

```bash
# 1. Clonar y entrar al proyecto
cd FACTURACION

# 2. Backend
cd api
npm install
cp config/development.env.example config/development.env  # editar credenciales
npm run migration:run    # crear tablas si no existen
npm run seed:run         # permisos + admin por defecto
npm run start:dev        # http://localhost:3000

# 3. Frontend (otra terminal)
cd front
npm install
npm run dev              # http://localhost:5173

# Login por defecto: admin / admin
```

---

## 🧱 Stack Tecnológico

### Backend

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | 24.11.1 |
| Framework | Express | 5.2.1 |
| Lenguaje | TypeScript | 7.0.2 |
| ORM | Sequelize | 6.37.8 |
| DB Driver | mysql2 | 3.23.0 |
| DI | Awilix | 13.0.5 |
| Auth | express-jwt + jsonwebtoken | 8.5.1 / 9.0.3 |
| Validación | express-validator | 7.3.2 |
| PDF | PDFKit | 0.19.1 |
| Excel | ExcelJS | 4.4.0 |
| Archivos | multer | 2.2.0 |

### Frontend

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React | 19.2.7 |
| Lenguaje | TypeScript | 6.0.2 |
| UI Library | Ant Design | 6.5.1 |
| Icons | @ant-design/icons | 6.3.2 |
| Router | react-router-dom | 7.18.1 |
| HTTP | axios | 1.18.1 |
| Charts | recharts | 3.9.2 |
| Build | Vite | 8.1.1 |
| Barcodes | react-barcode / jsbarcode | 1.6.1 / 3.12.3 |

---

## 📐 Principios Arquitectónicos

1. **Separación de capas** — Controller → Service → Model (Sequelize). Los controllers no contienen lógica de negocio.
2. **Inyección de dependencias** — Awilix con `injectionMode: 'CLASSIC'`. Todos los servicios registrados como `scoped()`.
3. **API REST pura** — Siempre responde JSON. Sin renderizado server-side.
4. **Autenticación JWT dual** — Access token (8h) + Refresh token (7d). Rotación automática desde el frontend.
5. **Control de acceso por permisos** — Middleware `hasPermission('modulo')` en cada endpoint. Admin bypass automático.
6. **Nombres de tabla legacy** — Los modelos Sequelize usan `tableName` exacto del sistema PHP. La BD no se modifica.
7. **Transacciones en operaciones críticas** — Compras, ventas y DTE usan transacciones Sequelize con rollback.
8. **Fire-and-forget para auditoría** — `AuditService.registrar()` con `.catch()` para no afectar el flujo principal.

---

## 🔐 Permisos del Sistema

| Permiso | Ruta (hasPermission) | Módulo |
|---------|---------------------|--------|
| `dashboard` | Dashboard + Analíticas | Inicio |
| `inventario` | Artículos + Categorías | Inventario |
| `ventas` | Ventas (POS + historial + clientes) | Ventas |
| `compras` | Compras + Proveedores | Compras |
| `usuarios` | Usuarios + Auditoría | Admin |
| `reportes-ventas` | Reportes de ventas | Reportes |
| `reportes-compras` | Reportes de compras | Reportes |
