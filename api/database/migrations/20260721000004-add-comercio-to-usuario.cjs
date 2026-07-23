'use strict';

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('usuario');

    if (!table.idcomercio) {
      await queryInterface.addColumn('usuario', 'idcomercio', {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'comercio', key: 'idcomercio' },
        onDelete: 'SET NULL'
      });
    }

    if (!table.idsucursal) {
      await queryInterface.addColumn('usuario', 'idsucursal', {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sucursal', key: 'idsucursal' },
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('usuario');
    if (table.idcomercio) await queryInterface.removeColumn('usuario', 'idcomercio');
    if (table.idsucursal) await queryInterface.removeColumn('usuario', 'idsucursal');
  }
};
