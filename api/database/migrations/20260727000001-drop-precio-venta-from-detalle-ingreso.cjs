'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('detalle_ingreso', 'precio_venta');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('detalle_ingreso', 'precio_venta', {
      type: Sequelize.DECIMAL(11, 2),
      allowNull: true,
      defaultValue: null
    });
  }
};
