'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('detalle_ingreso', 'precio_venta', {
      type: Sequelize.DECIMAL(11, 2),
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('detalle_ingreso', 'precio_venta', {
      type: Sequelize.DECIMAL(11, 2),
      allowNull: false,
      defaultValue: 0.00
    });
  }
};
