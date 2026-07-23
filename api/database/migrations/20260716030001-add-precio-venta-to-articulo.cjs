'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('articulo', 'precio_venta', {
      type: Sequelize.DECIMAL(11, 2),
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('articulo', 'precio_venta');
  }
};
