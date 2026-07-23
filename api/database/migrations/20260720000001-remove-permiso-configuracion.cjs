'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Primero eliminar relaciones de usuarios con este permiso
    await queryInterface.sequelize.query(
      "DELETE FROM usuario_permiso WHERE idpermiso = (SELECT idpermiso FROM permiso WHERE nombre = 'configuracion')"
    );
    // Luego eliminar el permiso
    await queryInterface.sequelize.query(
      "DELETE FROM permiso WHERE nombre = 'configuracion'"
    );
  },

  async down(queryInterface) {
    // Reversión: restaurar el permiso
    await queryInterface.bulkInsert('permiso', [
      { idpermiso: 8, nombre: 'configuracion' }
    ]);
  }
};
