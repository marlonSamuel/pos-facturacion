'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('persona', {
      idpersona: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      tipo_persona: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      tipo_documento: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      num_documento: {
        type: Sequelize.STRING(20),
        allowNull: true
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
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('persona');
  }
};
