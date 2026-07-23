'use strict';

const TABLES = [
  'usuario', 'permiso', 'usuario_permiso',
  'categoria', 'articulo',
  'persona',
  'ingreso', 'detalle_ingreso',
  'venta', 'detalle_venta',
  'token_dte', 'sat_facturas',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const table of TABLES) {
      try {
        const cols = await queryInterface.describeTable(table);
        const queries = [];
        if (!cols.createdAt) {
          queries.push(`ALTER TABLE \`${table}\` ADD COLUMN \`createdAt\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP`);
        }
        if (!cols.updatedAt) {
          queries.push(`ALTER TABLE \`${table}\` ADD COLUMN \`updatedAt\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        }
        for (const q of queries) {
          await queryInterface.sequelize.query(q);
        }
      } catch { /* table may not exist */ }
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      try {
        await queryInterface.removeColumn(table, 'createdAt');
        await queryInterface.removeColumn(table, 'updatedAt');
      } catch { /* ignore */ }
    }
  }
};
