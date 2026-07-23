'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuario', 'idrol', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'rol', key: 'idrol' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuario', 'idrol');
  }
};
