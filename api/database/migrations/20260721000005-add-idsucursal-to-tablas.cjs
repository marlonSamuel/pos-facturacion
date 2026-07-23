'use strict';

const TABLAS = ['articulo', 'categoria', 'persona', 'venta', 'ingreso'];

module.exports = {
  async up(queryInterface) {
    for (const tabla of TABLAS) {
      const columns = await queryInterface.describeTable(tabla);
      if (!columns.idsucursal) {
        await queryInterface.addColumn(tabla, 'idsucursal', {
          type: queryInterface.sequelize.Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        });
      }
    }
  },

  async down(queryInterface) {
    for (const tabla of TABLAS) {
      const columns = await queryInterface.describeTable(tabla);
      if (columns.idsucursal) {
        await queryInterface.removeColumn(tabla, 'idsucursal');
      }
    }
  }
};
