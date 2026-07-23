'use strict';

/** Tablas maestras que deben pertenecer al comercio, no a la sucursal */
const TABLAS = ['categoria', 'articulo', 'persona'];

module.exports = {
  async up(queryInterface) {
    for (const tabla of TABLAS) {
      const columns = await queryInterface.describeTable(tabla);
      if (!columns.idcomercio) {
        await queryInterface.addColumn(tabla, 'idcomercio', {
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
      if (columns.idcomercio) {
        await queryInterface.removeColumn(tabla, 'idcomercio');
      }
    }
  }
};
