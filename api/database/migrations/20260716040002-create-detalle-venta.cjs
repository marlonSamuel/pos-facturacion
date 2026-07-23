'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detalle_venta', {
      iddetalle_venta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idventa: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'venta', key: 'idventa' },
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
      precio_venta: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      },
      descuento: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
        defaultValue: 0.00
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_venta');
  }
};
