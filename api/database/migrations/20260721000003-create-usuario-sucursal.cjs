'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('usuario_sucursal', {
      idusuario_sucursal: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idusuario: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuario', key: 'idusuario' },
        onDelete: 'CASCADE'
      },
      idsucursal: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sucursal', key: 'idsucursal' },
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: queryInterface.sequelize.Sequelize.DATE,
        allowNull: true,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Unique constraint: un usuario no puede tener la misma sucursal dos veces
    await queryInterface.addConstraint('usuario_sucursal', {
      fields: ['idusuario', 'idsucursal'],
      type: 'unique',
      name: 'uq_usuario_sucursal'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('usuario_sucursal');
  }
};
