'use strict';

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('usuario');
    if (table.cargo) {
      await queryInterface.removeColumn('usuario', 'cargo');
    }
  },

  async down(queryInterface) {
    await queryInterface.addColumn('usuario', 'cargo', {
      type: queryInterface.sequelize.Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null
    });
  }
};
