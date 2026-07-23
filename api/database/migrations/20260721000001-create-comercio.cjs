'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('comercio', {
      idcomercio: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      nombre: {
        type: queryInterface.sequelize.Sequelize.STRING(100),
        allowNull: false
      },
      nickname: {
        type: queryInterface.sequelize.Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: queryInterface.sequelize.Sequelize.TEXT,
        allowNull: true
      },
      direccion: {
        type: queryInterface.sequelize.Sequelize.STRING(150),
        allowNull: true
      },
      telefono: {
        type: queryInterface.sequelize.Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: queryInterface.sequelize.Sequelize.STRING(50),
        allowNull: true
      },
      logo: {
        type: queryInterface.sequelize.Sequelize.STRING(255),
        allowNull: true
      },
      color_primario: {
        type: queryInterface.sequelize.Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#1890ff'
      },
      condicion: {
        type: queryInterface.sequelize.Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1
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
    await queryInterface.dropTable('comercio');
  }
};
