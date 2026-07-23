'use strict';

module.exports = {
  async up(queryInterface) {
    // Admin: todos los permisos (id 1-7)
    await queryInterface.bulkInsert('rol', [
      { idrol: 1, nombre: 'Admin', descripcion: 'Acceso total al sistema' },
      { idrol: 2, nombre: 'Vendedor', descripcion: 'Ventas, clientes y dashboard' },
      { idrol: 3, nombre: 'Bodeguero', descripcion: 'Inventario, compras y proveedores' },
      { idrol: 4, nombre: 'Consulta', descripcion: 'Solo lectura: dashboard y reportes' },
    ], { ignoreDuplicates: true });

    // Admin → todos los permisos
    await queryInterface.bulkInsert('rol_permiso', [
      { idrol: 1, idpermiso: 1 },  // ventas
      { idrol: 1, idpermiso: 2 },  // compras
      { idrol: 1, idpermiso: 3 },  // inventario
      { idrol: 1, idpermiso: 4 },  // usuarios
      { idrol: 1, idpermiso: 5 },  // reportes-compras
      { idrol: 1, idpermiso: 6 },  // reportes-ventas
      { idrol: 1, idpermiso: 7 },  // dashboard
    ], { ignoreDuplicates: true });

    // Vendedor → dashboard, ventas
    await queryInterface.bulkInsert('rol_permiso', [
      { idrol: 2, idpermiso: 7 },  // dashboard
      { idrol: 2, idpermiso: 1 },  // ventas
    ], { ignoreDuplicates: true });

    // Bodeguero → inventario, compras, reportes-compras
    await queryInterface.bulkInsert('rol_permiso', [
      { idrol: 3, idpermiso: 3 },  // inventario
      { idrol: 3, idpermiso: 2 },  // compras
      { idrol: 3, idpermiso: 5 },  // reportes-compras
    ]);

    // Consulta → dashboard, reportes-ventas, reportes-compras
    await queryInterface.bulkInsert('rol_permiso', [
      { idrol: 4, idpermiso: 7 },  // dashboard
      { idrol: 4, idpermiso: 6 },  // reportes-ventas
      { idrol: 4, idpermiso: 5 },  // reportes-compras
    ]);

    // Asignar rol Admin al usuario existente (id=1)
    await queryInterface.sequelize.query(
      "UPDATE usuario SET idrol = 1 WHERE idusuario = 1"
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("UPDATE usuario SET idrol = NULL WHERE idrol = 1");
    await queryInterface.bulkDelete('rol_permiso', null, {});
    await queryInterface.bulkDelete('rol', null, {});
  }
};
