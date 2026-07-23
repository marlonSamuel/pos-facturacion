'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('articulo', {
      idarticulo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idcategoria: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'categoria', key: 'idcategoria' }
      },
      codigo: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      descripcion: {
        type: Sequelize.STRING(256),
        allowNull: true
      },
      imagen: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      condicion: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1
      }
    });

    await queryInterface.addConstraint('articulo', {
      fields: ['nombre'],
      type: 'unique',
      name: 'articulo_nombre_UNIQUE'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('articulo');
  }
};
