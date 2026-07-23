'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuario', {
      idusuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      tipo_documento: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'DPI'
      },
      num_documento: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '0'
      },
      direccion: {
        type: Sequelize.STRING(70),
        allowNull: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      cargo: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      login: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      clave: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      imagen: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'default.png'
      },
      condicion: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1
      }
    });

    await queryInterface.addConstraint('usuario', {
      fields: ['login'],
      type: 'unique',
      name: 'login_UNIQUE'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('usuario');
  }
};
