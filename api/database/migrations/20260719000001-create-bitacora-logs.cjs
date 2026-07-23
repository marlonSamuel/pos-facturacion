'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bitacora_logs', {
      idbitacora: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      usuario: { type: Sequelize.STRING(100), allowNull: true },
      accion: { type: Sequelize.STRING(50), allowNull: false },
      tabla: { type: Sequelize.STRING(50), allowNull: true },
      registro_id: { type: Sequelize.INTEGER, allowNull: true },
      detalle: { type: Sequelize.TEXT, allowNull: true },
      ip: { type: Sequelize.STRING(45), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bitacora_logs');
  }
};
