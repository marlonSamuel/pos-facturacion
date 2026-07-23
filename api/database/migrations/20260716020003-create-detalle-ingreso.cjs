'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detalle_ingreso', {
      iddetalle_ingreso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idingreso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ingreso', key: 'idingreso' },
        onDelete: 'CASCADE'
      },
      idarticulo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'articulo', key: 'idarticulo' }
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      precio_compra: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      },
      precio_venta: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_ingreso');
  }
};
