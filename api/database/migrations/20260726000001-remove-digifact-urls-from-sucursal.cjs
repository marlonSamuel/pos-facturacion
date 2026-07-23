'use strict';

module.exports = {
  async up(queryInterface) {
    const columns = await queryInterface.describeTable('sucursal');

    if (columns.auth_url_digifact) {
      await queryInterface.removeColumn('sucursal', 'auth_url_digifact');
    }
    if (columns.cert_url_digifact) {
      await queryInterface.removeColumn('sucursal', 'cert_url_digifact');
    }
    if (columns.cancel_url_digifact) {
      await queryInterface.removeColumn('sucursal', 'cancel_url_digifact');
    }
  },

  async down(queryInterface) {
    await queryInterface.addColumn('sucursal', 'auth_url_digifact', {
      type: queryInterface.sequelize.Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('sucursal', 'cert_url_digifact', {
      type: queryInterface.sequelize.Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('sucursal', 'cancel_url_digifact', {
      type: queryInterface.sequelize.Sequelize.STRING(255),
      allowNull: true
    });
  }
};
