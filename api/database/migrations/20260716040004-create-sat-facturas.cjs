'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sat_facturas', {
      idfactura: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idventa: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'venta', key: 'idventa' }
      },
      estado: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      AcuseReciboSAT: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      autorizacion: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      serie: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      numero: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      fecha_dt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nit_eface: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      nombre_eface: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      nit_comprador: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      nombre_comprador: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      backprocesor: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      fecha_certificacion: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ResponseDATA1: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      ResponseDATA2: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      ResponseDATA3: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      total: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: true
      },
      impuesto: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: true
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sat_facturas');
  }
};
