'use strict';

module.exports = {
  async up(queryInterface) {
    // 1. Agregar principal a sucursal (default 0)
    const sucCols = await queryInterface.describeTable('sucursal');
    if (!sucCols.principal) {
      await queryInterface.addColumn('sucursal', 'principal', {
        type: queryInterface.sequelize.Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      });
    }

    // 2. Marcar Matriz (idsucursal=1) como principal
    await queryInterface.sequelize.query(
      "UPDATE sucursal SET principal = 1 WHERE idsucursal = 1"
    );

    // 3. Dropear idsucursal de usuario
    const usrCols = await queryInterface.describeTable('usuario');
    if (usrCols.idsucursal) {
      await queryInterface.removeColumn('usuario', 'idsucursal');
    }
  },

  async down(queryInterface) {
    const usrCols = await queryInterface.describeTable('usuario');
    if (!usrCols.idsucursal) {
      await queryInterface.addColumn('usuario', 'idsucursal', {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      });
    }

    const sucCols = await queryInterface.describeTable('sucursal');
    if (sucCols.principal) {
      await queryInterface.removeColumn('sucursal', 'principal');
    }
  }
};
