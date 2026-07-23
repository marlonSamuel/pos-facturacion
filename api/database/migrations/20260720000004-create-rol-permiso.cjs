'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rol_permiso', {
      idrol_permiso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      idrol: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'rol', key: 'idrol' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      idpermiso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'permiso', key: 'idpermiso' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rol_permiso');
  }
};
