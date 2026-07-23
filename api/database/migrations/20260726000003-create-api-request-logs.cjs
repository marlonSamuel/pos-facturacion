'use strict';

module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.sequelize.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_request_logs'",
      { type: queryInterface.sequelize.Sequelize.QueryTypes.SELECT }
    );

    if (!tables.length) {
      await queryInterface.createTable('api_request_logs', {
        id: {
          type: queryInterface.sequelize.Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        idsucursal: {
          type: queryInterface.sequelize.Sequelize.INTEGER,
          allowNull: true
        },
        endpoint: {
          type: queryInterface.sequelize.Sequelize.STRING(50),
          allowNull: false,
          comment: 'Ej: dte-auth, dte-certify, dte-cancel'
        },
        request_url: {
          type: queryInterface.sequelize.Sequelize.TEXT,
          allowNull: true
        },
        request_body: {
          type: queryInterface.sequelize.Sequelize.TEXT,
          allowNull: true
        },
        response_status: {
          type: queryInterface.sequelize.Sequelize.STRING(20),
          allowNull: true
        },
        response_body: {
          type: queryInterface.sequelize.Sequelize.TEXT,
          allowNull: true
        },
        success: {
          type: queryInterface.sequelize.Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 0
        },
        created_at: {
          type: queryInterface.sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('api_request_logs');
  }
};
