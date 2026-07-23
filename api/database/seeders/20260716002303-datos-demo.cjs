'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ── Categorías ──
    await queryInterface.bulkInsert('categoria', [
      { idcategoria: 1, nombre: 'Muebles', descripcion: 'Escritorios, sillas, estanterías', condicion: 1, idcomercio: 1 },
      { idcategoria: 2, nombre: 'Electrónica', descripcion: 'Lámparas, cables, dispositivos', condicion: 1, idcomercio: 1 },
      { idcategoria: 3, nombre: 'Papelería', descripcion: 'Útiles de oficina y escolar', condicion: 1, idcomercio: 1 },
      { idcategoria: 4, nombre: 'Limpieza', descripcion: 'Productos de limpieza e higiene', condicion: 1, idcomercio: 1 },
    ], { ignoreDuplicates: true });

    // ── Artículos (sin stock — se asigna via articulo_sucursal) ──
    await queryInterface.bulkInsert('articulo', [
      { idarticulo: 1, idcategoria: 1, codigo: 'MUE-001', nombre: 'Escritorio Ejecutivo', precio_venta: 2400.00, descripcion: 'Escritorio de madera 1.50m', condicion: 1 },
      { idarticulo: 2, idcategoria: 1, codigo: 'MUE-002', nombre: 'Silla Ergonómica', precio_venta: 1800.00, descripcion: 'Silla de oficina ajustable', condicion: 1 },
      { idarticulo: 3, idcategoria: 1, codigo: 'MUE-003', nombre: 'Estantería Metálica', precio_venta: 950.00, descripcion: 'Estantería 5 niveles', condicion: 1 },
      { idarticulo: 4, idcategoria: 1, codigo: 'MUE-004', nombre: 'Mesa Plegable', precio_venta: 450.00, descripcion: 'Mesa rectangular 1.20m', condicion: 1 },
      { idarticulo: 5, idcategoria: 1, codigo: 'MUE-005', nombre: 'Silla Plástica', precio_venta: 120.00, descripcion: 'Silla básica color negro', condicion: 1 },
      { idarticulo: 6, idcategoria: 2, codigo: 'ELE-001', nombre: 'Lámpara LED Escritorio', precio_venta: 350.00, descripcion: 'Lámpara ajustable 12W', condicion: 1 },
      { idarticulo: 7, idcategoria: 2, codigo: 'ELE-002', nombre: 'Cable USB-C 2m', precio_venta: 45.00, descripcion: 'Cable carga rápida', condicion: 1 },
      { idarticulo: 8, idcategoria: 2, codigo: 'ELE-003', nombre: 'Regleta 6 tomas', precio_venta: 85.00, descripcion: 'Regleta con protector', condicion: 1 },
      { idarticulo: 9, idcategoria: 3, codigo: 'PAP-001', nombre: 'Resma Papel Bond', precio_venta: 55.00, descripcion: '500 hojas tamaño carta', condicion: 1 },
      { idarticulo: 10, idcategoria: 3, codigo: 'PAP-002', nombre: 'Folder Tamaño Carta', precio_venta: 2.50, descripcion: 'Folder manila estándar', condicion: 1 },
      { idarticulo: 11, idcategoria: 4, codigo: 'LIM-001', nombre: 'Cloro Galón', precio_venta: 28.00, descripcion: 'Cloro líquido 3.78L', condicion: 1 },
      { idarticulo: 12, idcategoria: 4, codigo: 'LIM-002', nombre: 'Desinfectante Aerosol', precio_venta: 35.00, descripcion: 'Desinfectante 400ml', condicion: 1 },
    ], { ignoreDuplicates: true });

    // ── Stock inicial (articulo_sucursal, sucursal 1) ──
    await queryInterface.bulkInsert('articulo_sucursal', [
      { idarticulo: 1, idsucursal: 1, stock: 15 },
      { idarticulo: 2, idsucursal: 1, stock: 22 },
      { idarticulo: 3, idsucursal: 1, stock: 8 },
      { idarticulo: 4, idsucursal: 1, stock: 3 },
      { idarticulo: 5, idsucursal: 1, stock: 2 },
      { idarticulo: 6, idsucursal: 1, stock: 18 },
      { idarticulo: 7, idsucursal: 1, stock: 45 },
      { idarticulo: 8, idsucursal: 1, stock: 12 },
      { idarticulo: 9, idsucursal: 1, stock: 30 },
      { idarticulo: 10, idsucursal: 1, stock: 100 },
      { idarticulo: 11, idsucursal: 1, stock: 20 },
      { idarticulo: 12, idsucursal: 1, stock: 0 },
    ], { ignoreDuplicates: true });

    // ── Personas (Clientes + Proveedores) ──
    await queryInterface.bulkInsert('persona', [
      { idpersona: 1, tipo_persona: 'Cliente', nombre: 'María López García', tipo_documento: 'NIT', num_documento: 'CF', direccion: '6a Av. 12-34, Zona 1', telefono: '41234567', email: 'maria@email.com' },
      { idpersona: 2, tipo_persona: 'Cliente', nombre: 'Carlos Méndez Ruiz', tipo_documento: 'NIT', num_documento: '58963214', direccion: 'Colonia Las Flores, Casa 7', telefono: '52345678', email: 'carlos@email.com' },
      { idpersona: 3, tipo_persona: 'Cliente', nombre: 'Ana Rivera Santos', tipo_documento: 'NIT', num_documento: '74125896', direccion: '3a Calle 5-67, Zona 3', telefono: '53456789', email: 'ana@email.com' },
      { idpersona: 4, tipo_persona: 'Cliente', nombre: 'Comercial GT, S.A.', tipo_documento: 'NIT', num_documento: '12345678', direccion: 'Boulevard Principal Km 15', telefono: '24567890', email: 'info@comercialgt.com' },
      { idpersona: 5, tipo_persona: 'Cliente', nombre: 'Distribuidora del Sur', tipo_documento: 'NIT', num_documento: '87654321', direccion: 'Carretera al Sur, Bodega 3', telefono: '25678901', email: 'ventas@delsur.com' },
      { idpersona: 6, tipo_persona: 'Proveedor', nombre: 'Muebles y Más, S.A.', tipo_documento: 'NIT', num_documento: '98765432', direccion: 'Zona Industrial, Bodega 12', telefono: '23654789', email: 'ventas@mueblesymas.com' },
      { idpersona: 7, tipo_persona: 'Proveedor', nombre: 'Importadora Electrónica', tipo_documento: 'NIT', num_documento: '45678912', direccion: '5a Av. 22-33, Zona 10', telefono: '26789012', email: 'info@importadorael.com' },
      { idpersona: 8, tipo_persona: 'Proveedor', nombre: 'Distribuidora de Oficina', tipo_documento: 'NIT', num_documento: '32165498', direccion: 'Calzada Aguilar Batres 45-67', telefono: '27890123', email: 'pedidos@distoficina.com' },
    ], { ignoreDuplicates: true });

    // ── Ingresos (Compras) ──
    const hoy = new Date();
    function hace(dias) { const d = new Date(hoy); d.setDate(d.getDate() - dias); return d; }

    await queryInterface.bulkInsert('ingreso', [
      { idingreso: 1, idproveedor: 6, idusuario: 1, tipo_comprobante: 'Boleta', serie_comprobante: 'C', num_comprobante: '001', fecha_hora: hace(30), impuesto: 0, total_compra: 28500, estado: 'Aceptado' },
      { idingreso: 2, idproveedor: 7, idusuario: 1, tipo_comprobante: 'Boleta', serie_comprobante: 'C', num_comprobante: '002', fecha_hora: hace(25), impuesto: 0, total_compra: 12250, estado: 'Aceptado' },
      { idingreso: 3, idproveedor: 8, idusuario: 1, tipo_comprobante: 'Factura', serie_comprobante: 'F', num_comprobante: 'P-001', fecha_hora: hace(20), impuesto: 210, total_compra: 1960, estado: 'Aceptado' },
      { idingreso: 4, idproveedor: 6, idusuario: 1, tipo_comprobante: 'Boleta', serie_comprobante: 'C', num_comprobante: '003', fecha_hora: hace(15), impuesto: 0, total_compra: 11400, estado: 'Aceptado' },
      { idingreso: 5, idproveedor: 7, idusuario: 1, tipo_comprobante: 'Factura', serie_comprobante: 'F', num_comprobante: 'P-002', fecha_hora: hace(10), impuesto: 315, total_compra: 2940, estado: 'Aceptado' },
    ], { ignoreDuplicates: true });

    await queryInterface.bulkInsert('detalle_ingreso', [
      { iddetalle_ingreso: 1, idingreso: 1, idarticulo: 1, cantidad: 10, precio_compra: 1800, precio_venta: 2400 },
      { iddetalle_ingreso: 2, idingreso: 1, idarticulo: 2, cantidad: 15, precio_compra: 1200, precio_venta: 1800 },
      { iddetalle_ingreso: 3, idingreso: 2, idarticulo: 6, cantidad: 20, precio_compra: 250, precio_venta: 350 },
      { iddetalle_ingreso: 4, idingreso: 2, idarticulo: 7, cantidad: 50, precio_compra: 30, precio_venta: 45 },
      { iddetalle_ingreso: 5, idingreso: 2, idarticulo: 8, cantidad: 15, precio_compra: 60, precio_venta: 85 },
      { iddetalle_ingreso: 6, idingreso: 3, idarticulo: 9, cantidad: 40, precio_compra: 40, precio_venta: 55 },
      { iddetalle_ingreso: 7, idingreso: 3, idarticulo: 10, cantidad: 200, precio_compra: 1.80, precio_venta: 2.50 },
      { iddetalle_ingreso: 8, idingreso: 4, idarticulo: 3, cantidad: 10, precio_compra: 700, precio_venta: 950 },
      { iddetalle_ingreso: 9, idingreso: 4, idarticulo: 4, cantidad: 15, precio_compra: 300, precio_venta: 450 },
      { iddetalle_ingreso: 10, idingreso: 5, idarticulo: 11, cantidad: 30, precio_compra: 20, precio_venta: 28 },
      { iddetalle_ingreso: 11, idingreso: 5, idarticulo: 12, cantidad: 25, precio_compra: 25, precio_venta: 35 },
    ], { ignoreDuplicates: true });

    // ── Ventas ──
    await queryInterface.bulkInsert('venta', [
      { idventa: 1, idcliente: 1, idusuario: 1, tipo_comprobante: 'Boleta', serie_comprobante: 'B', num_comprobante: '001', fecha_hora: hace(20), impuesto: 0, total_venta: 4200, estado: 'Aceptado' },
      { idventa: 2, idcliente: 2, idusuario: 1, tipo_comprobante: 'Ticket', serie_comprobante: 'T', num_comprobante: '001', fecha_hora: hace(18), impuesto: 0, total_venta: 230, estado: 'Aceptado' },
      { idventa: 3, idcliente: 4, idusuario: 1, tipo_comprobante: 'Factura', serie_comprobante: 'F', num_comprobante: 'A-001', fecha_hora: hace(15), impuesto: 450, total_venta: 4200, estado: 'Aceptado' },
      { idventa: 4, idcliente: 3, idusuario: 1, tipo_comprobante: 'Boleta', serie_comprobante: 'B', num_comprobante: '002', fecha_hora: hace(12), impuesto: 0, total_venta: 890, estado: 'Aceptado' },
      { idventa: 5, idcliente: 5, idusuario: 1, tipo_comprobante: 'Factura', serie_comprobante: 'F', num_comprobante: 'A-002', fecha_hora: hace(8), impuesto: 600, total_venta: 5600, estado: 'Aceptado' },
      { idventa: 6, idcliente: 1, idusuario: 1, tipo_comprobante: 'Ticket', serie_comprobante: 'T', num_comprobante: '002', fecha_hora: hace(5), impuesto: 0, total_venta: 450, estado: 'Aceptado' },
      { idventa: 7, idcliente: 2, idusuario: 1, tipo_comprobante: 'Boleta', serie_comprobante: 'B', num_comprobante: '003', fecha_hora: hace(3), impuesto: 0, total_venta: 1800, estado: 'Aceptado' },
      { idventa: 8, idcliente: 4, idusuario: 1, tipo_comprobante: 'Factura', serie_comprobante: 'F', num_comprobante: 'A-003', fecha_hora: hace(1), impuesto: 1280, total_venta: 12000, estado: 'Aceptado' },
      { idventa: 9, idcliente: 3, idusuario: 1, tipo_comprobante: 'Ticket', serie_comprobante: 'T', num_comprobante: '003', fecha_hora: hace(0.2), impuesto: 0, total_venta: 120, estado: 'Aceptado' },
      { idventa: 10, idcliente: 1, idusuario: 1, tipo_comprobante: 'Boleta', serie_comprobante: 'B', num_comprobante: '004', fecha_hora: hace(0.1), impuesto: 0, total_venta: 350, estado: 'Aceptado' },
    ], { ignoreDuplicates: true });

    await queryInterface.bulkInsert('detalle_venta', [
      { iddetalle_venta: 1, idventa: 1, idarticulo: 1, cantidad: 1, precio_venta: 2400, descuento: 0 },
      { iddetalle_venta: 2, idventa: 1, idarticulo: 2, cantidad: 1, precio_venta: 1800, descuento: 0 },
      { iddetalle_venta: 3, idventa: 2, idarticulo: 5, cantidad: 1, precio_venta: 120, descuento: 0 },
      { iddetalle_venta: 4, idventa: 2, idarticulo: 11, cantidad: 2, precio_venta: 55, descuento: 0 },
      { iddetalle_venta: 5, idventa: 3, idarticulo: 3, cantidad: 3, precio_venta: 950, descuento: 0 },
      { iddetalle_venta: 6, idventa: 3, idarticulo: 8, cantidad: 5, precio_venta: 85, descuento: 0 },
      { iddetalle_venta: 7, idventa: 3, idarticulo: 7, cantidad: 10, precio_venta: 45, descuento: 0 },
      { iddetalle_venta: 8, idventa: 4, idarticulo: 6, cantidad: 2, precio_venta: 350, descuento: 0 },
      { iddetalle_venta: 9, idventa: 4, idarticulo: 8, cantidad: 1, precio_venta: 85, descuento: 0 },
      { iddetalle_venta: 10, idventa: 4, idarticulo: 11, cantidad: 3, precio_venta: 35, descuento: 0 },
      { iddetalle_venta: 11, idventa: 5, idarticulo: 1, cantidad: 2, precio_venta: 2400, descuento: 0 },
      { iddetalle_venta: 12, idventa: 5, idarticulo: 8, cantidad: 4, precio_venta: 85, descuento: 0 },
      { iddetalle_venta: 13, idventa: 5, idarticulo: 7, cantidad: 20, precio_venta: 45, descuento: 0 },
      { iddetalle_venta: 14, idventa: 6, idarticulo: 4, cantidad: 1, precio_venta: 450, descuento: 0 },
      { iddetalle_venta: 15, idventa: 7, idarticulo: 2, cantidad: 1, precio_venta: 1800, descuento: 0 },
      { iddetalle_venta: 16, idventa: 8, idarticulo: 3, cantidad: 8, precio_venta: 950, descuento: 0 },
      { iddetalle_venta: 17, idventa: 8, idarticulo: 6, cantidad: 6, precio_venta: 350, descuento: 0 },
      { iddetalle_venta: 18, idventa: 8, idarticulo: 9, cantidad: 20, precio_venta: 55, descuento: 0 },
      { iddetalle_venta: 19, idventa: 9, idarticulo: 10, cantidad: 10, precio_venta: 2.50, descuento: 0 },
      { iddetalle_venta: 20, idventa: 9, idarticulo: 12, cantidad: 1, precio_venta: 35, descuento: 0 },
      { iddetalle_venta: 21, idventa: 10, idarticulo: 6, cantidad: 1, precio_venta: 350, descuento: 0 },
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('articulo_sucursal', null, {});
    await queryInterface.bulkDelete('detalle_venta', null, {});
    await queryInterface.bulkDelete('venta', null, {});
    await queryInterface.bulkDelete('detalle_ingreso', null, {});
    await queryInterface.bulkDelete('ingreso', null, {});
    await queryInterface.bulkDelete('persona', null, {});
    await queryInterface.bulkDelete('articulo', null, {});
    await queryInterface.bulkDelete('categoria', null, {});
  }
};
