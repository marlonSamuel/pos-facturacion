'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE permiso SET nombre = 'dashboard' WHERE idpermiso = 7;
    `);
    await queryInterface.sequelize.query(`
      UPDATE permiso SET nombre = 'inventario' WHERE idpermiso = 3;
    `);
    await queryInterface.sequelize.query(`
      UPDATE permiso SET nombre = 'reportes-ventas' WHERE idpermiso = 6;
    `);
    await queryInterface.sequelize.query(`
      UPDATE permiso SET nombre = 'reportes-compras' WHERE idpermiso = 5;
    `);
    // ventas (id=1), compras (id=2), usuarios (id=4) se quedan igual
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE permiso SET nombre = 'escritorio' WHERE idpermiso = 7;
    `);
    await queryInterface.sequelize.query(`
      UPDATE permiso SET nombre = 'almacen' WHERE idpermiso = 3;
    `);
    await queryInterface.sequelize.query(`
      UPDATE permiso SET nombre = 'consultav' WHERE idpermiso = 6;
    `);
    await queryInterface.sequelize.query(`
      UPDATE permiso SET nombre = 'consultac' WHERE idpermiso = 5;
    `);
  }
};
