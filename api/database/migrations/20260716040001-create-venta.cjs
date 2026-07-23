'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venta', {
      idventa: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idcliente: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'persona', key: 'idpersona' }
      },
      idusuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuario', key: 'idusuario' }
      },
      tipo_comprobante: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      serie_comprobante: {
        type: Sequelize.STRING(7),
        allowNull: true
      },
      num_comprobante: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      fecha_hora: {
        type: Sequelize.DATE,
        allowNull: false
      },
      impuesto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total_venta: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Aceptado'
      },
      tipo_venta: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'CA'
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('venta');
  }
};
