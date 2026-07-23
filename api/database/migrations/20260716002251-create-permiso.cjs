'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permiso', {
      idpermiso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      nombre: {
        type: Sequelize.STRING(30),
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('permiso');
  }
};
