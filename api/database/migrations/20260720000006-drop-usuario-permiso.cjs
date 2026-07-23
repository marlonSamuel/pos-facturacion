'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Asignar rol Consulta a usuarios que aún no tienen rol (medida de seguridad)
    await queryInterface.sequelize.query(
      "UPDATE usuario SET idrol = 4 WHERE idrol IS NULL"
    );
    // Eliminar tabla de permisos directos (ahora se manejan vía roles)
    await queryInterface.dropTable('usuario_permiso');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('usuario_permiso', {
      idusuario_permiso: {
        type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true,
      },
      idusuario: { type: Sequelize.INTEGER, allowNull: false },
      idpermiso: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: true },
      updatedAt: { type: Sequelize.DATE, allowNull: true },
    });
  }
};
