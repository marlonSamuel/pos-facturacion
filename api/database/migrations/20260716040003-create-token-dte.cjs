'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_dte', {
      id_token: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      expira_en: {
        type: Sequelize.DATE,
        allowNull: false
      },
      otorgado_a: {
        type: Sequelize.STRING(100),
        allowNull: true
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('token_dte');
  }
};
