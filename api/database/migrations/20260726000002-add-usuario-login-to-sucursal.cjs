'use strict';

module.exports = {
  async up(queryInterface) {
    const columns = await queryInterface.describeTable('sucursal');

    if (!columns.usuario_login) {
      await queryInterface.addColumn('sucursal', 'usuario_login', {
        type: queryInterface.sequelize.Sequelize.STRING(100),
        allowNull: true,
        comment: 'Usuario completo para login API Digifact (ej: GT.000044653948.PRUEBAS56)'
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('sucursal');
    if (columns.usuario_login) {
      await queryInterface.removeColumn('sucursal', 'usuario_login');
    }
  }
};
