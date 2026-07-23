'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('permiso', [
      { idpermiso: 1, nombre: 'ventas' },
      { idpermiso: 2, nombre: 'compras' },
      { idpermiso: 3, nombre: 'inventario' },
      { idpermiso: 4, nombre: 'usuarios' },
      { idpermiso: 5, nombre: 'reportes-compras' },
      { idpermiso: 6, nombre: 'reportes-ventas' },
      { idpermiso: 7, nombre: 'dashboard' }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permiso', {}, {});
  }
};
