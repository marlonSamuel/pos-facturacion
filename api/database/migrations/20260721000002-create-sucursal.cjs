'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('sucursal', {
      idsucursal: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idcomercio: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'comercio', key: 'idcomercio' },
        onDelete: 'CASCADE'
      },
      codigo: {
        type: queryInterface.sequelize.Sequelize.STRING(10),
        allowNull: true
      },
      nombre: {
        type: queryInterface.sequelize.Sequelize.STRING(100),
        allowNull: false
      },
      direccion: {
        type: queryInterface.sequelize.Sequelize.STRING(150),
        allowNull: true
      },
      telefono: {
        type: queryInterface.sequelize.Sequelize.STRING(20),
        allowNull: true
      },
      condicion: {
        type: queryInterface.sequelize.Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1
      },
      // FEL / Digifact config
      nit: {
        type: queryInterface.sequelize.Sequelize.STRING(16),
        allowNull: true
      },
      nombre_emisor: {
        type: queryInterface.sequelize.Sequelize.STRING(150),
        allowNull: true
      },
      nombre_comercial: {
        type: queryInterface.sequelize.Sequelize.STRING(100),
        allowNull: true
      },
      direccion_emisor: {
        type: queryInterface.sequelize.Sequelize.STRING(200),
        allowNull: true
      },
      regimen: {
        type: queryInterface.sequelize.Sequelize.ENUM('GEN', 'PEQ'),
        allowNull: false,
        defaultValue: 'GEN'
      },
      usuario_digifact: {
        type: queryInterface.sequelize.Sequelize.STRING(50),
        allowNull: true
      },
      password_digifact: {
        type: queryInterface.sequelize.Sequelize.STRING(255),
        allowNull: true
      },
      codigo_establecimiento: {
        type: queryInterface.sequelize.Sequelize.STRING(4),
        allowNull: true
      },
      codigo_pos: {
        type: queryInterface.sequelize.Sequelize.STRING(4),
        allowNull: true
      },
      createdAt: {
        type: queryInterface.sequelize.Sequelize.DATE,
        allowNull: true,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: queryInterface.sequelize.Sequelize.DATE,
        allowNull: true,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sucursal');
  }
};
