import { Usuario } from './Usuario';
import { Permiso } from './Permiso';
import { Categoria } from './Categoria';
import { Articulo } from './Articulo';
import { Person } from './Person';
import { Ingreso } from './Ingreso';
import { DetalleIngreso } from './DetalleIngreso';
import { Venta } from './Venta';
import { DetalleVenta } from './DetalleVenta';
import { SatFactura } from './SatFactura';
import { BitacoraLog } from './BitacoraLog';
import { Rol } from './Rol';
import { RolPermiso } from './RolPermiso';
import { Comercio } from './Comercio';
import { Sucursal } from './Sucursal';
import { UsuarioSucursal } from './UsuarioSucursal';

import { ArticuloSucursal } from './ArticuloSucursal';

// Categoria ↔ Articulo
Categoria.hasMany(Articulo, {
  foreignKey: 'idcategoria',
  as: 'articulos'
});

Articulo.belongsTo(Categoria, {
  foreignKey: 'idcategoria',
  as: 'categoria'
});

// Articulo ↔ ArticuloSucursal
Articulo.hasMany(ArticuloSucursal, {
  foreignKey: 'idarticulo',
  as: 'inventario'
});

ArticuloSucursal.belongsTo(Articulo, {
  foreignKey: 'idarticulo',
  as: 'articulo'
});

// ArticuloSucursal ↔ Sucursal

// ArticuloSucursal ↔ Sucursal
ArticuloSucursal.belongsTo(Sucursal, {
  foreignKey: 'idsucursal',
  as: 'sucursal'
});

Sucursal.hasMany(ArticuloSucursal, {
  foreignKey: 'idsucursal',
  as: 'inventario'
});

// Ingreso ↔ DetalleIngreso
Ingreso.belongsTo(Person, {
  foreignKey: 'idproveedor',
  as: 'proveedor'
});

Ingreso.belongsTo(Usuario, {
  foreignKey: 'idusuario',
  as: 'usuario'
});

Ingreso.hasMany(DetalleIngreso, {
  foreignKey: 'idingreso',
  as: 'detalles'
});

DetalleIngreso.belongsTo(Ingreso, {
  foreignKey: 'idingreso',
  as: 'ingreso'
});

DetalleIngreso.belongsTo(Articulo, {
  foreignKey: 'idarticulo',
  as: 'articulo'
});

// Ingreso ↔ Sucursal
Ingreso.belongsTo(Sucursal, {
  foreignKey: 'idsucursal',
  as: 'sucursal'
});

Sucursal.hasMany(Ingreso, {
  foreignKey: 'idsucursal',
  as: 'ingresos'
});

// Venta ↔ DetalleVenta
Venta.belongsTo(Person, {
  foreignKey: 'idcliente',
  as: 'cliente'
});

Venta.belongsTo(Usuario, {
  foreignKey: 'idusuario',
  as: 'usuario'
});

Venta.hasMany(DetalleVenta, {
  foreignKey: 'idventa',
  as: 'detalles'
});

DetalleVenta.belongsTo(Venta, {
  foreignKey: 'idventa',
  as: 'venta'
});

DetalleVenta.belongsTo(Articulo, {
  foreignKey: 'idarticulo',
  as: 'articulo'
});

// Venta ↔ SatFactura
Venta.hasOne(SatFactura, {
  foreignKey: 'idventa',
  as: 'factura'
});

SatFactura.belongsTo(Venta, {
  foreignKey: 'idventa',
  as: 'venta'
});

// Venta ↔ Sucursal
Venta.belongsTo(Sucursal, {
  foreignKey: 'idsucursal',
  as: 'sucursal'
});

Sucursal.hasMany(Venta, {
  foreignKey: 'idsucursal',
  as: 'ventas'
});

// Rol ↔ RolPermiso ↔ Permiso
Rol.hasMany(RolPermiso, {
  foreignKey: 'idrol',
  as: 'rolPermisos'
});

RolPermiso.belongsTo(Rol, {
  foreignKey: 'idrol',
  as: 'rol'
});

RolPermiso.belongsTo(Permiso, {
  foreignKey: 'idpermiso',
  as: 'permiso'
});

Permiso.hasMany(RolPermiso, {
  foreignKey: 'idpermiso',
  as: 'rolPermisos'
});

// Usuario → Rol
Usuario.belongsTo(Rol, {
  foreignKey: 'idrol',
  as: 'rol'
});

Rol.hasMany(Usuario, {
  foreignKey: 'idrol',
  as: 'usuarios'
});

// ═══════════════════════════════════════════════
// Multi-Comercio / Multi-Sucursal
// ═══════════════════════════════════════════════

// Comercio ↔ Sucursal
Comercio.hasMany(Sucursal, {
  foreignKey: 'idcomercio',
  as: 'sucursales'
});

Sucursal.belongsTo(Comercio, {
  foreignKey: 'idcomercio',
  as: 'comercio'
});

// Usuario → Comercio
Usuario.belongsTo(Comercio, {
  foreignKey: 'idcomercio',
  as: 'comercio'
});

Comercio.hasMany(Usuario, {
  foreignKey: 'idcomercio',
  as: 'usuarios'
});

// Usuario ↔ Sucursal (N:M via usuario_sucursal)
Usuario.belongsToMany(Sucursal, {
  through: UsuarioSucursal,
  foreignKey: 'idusuario',
  otherKey: 'idsucursal',
  as: 'sucursales'
});

Sucursal.belongsToMany(Usuario, {
  through: UsuarioSucursal,
  foreignKey: 'idsucursal',
  otherKey: 'idusuario',
  as: 'usuarios'
});
