'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categoria', {
      idcategoria: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      nombre: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.STRING(256),
        allowNull: true
      },
      condicion: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1
      }
    });

    await queryInterface.addConstraint('categoria', {
      fields: ['nombre'],
      type: 'unique',
      name: 'categoria_nombre_UNIQUE'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('categoria');
  }
};
