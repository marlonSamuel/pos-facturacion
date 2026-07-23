'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuario_permiso', {
      idusuario_permiso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idusuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'idusuario'
        },
        onDelete: 'CASCADE'
      },
      idpermiso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permiso',
          key: 'idpermiso'
        },
        onDelete: 'CASCADE'
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('usuario_permiso');
  }
};
