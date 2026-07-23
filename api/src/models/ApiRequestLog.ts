import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const ApiRequestLog = sequelize.define('ApiRequestLog', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idsucursal: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  endpoint: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Ej: dte-auth, dte-certify, dte-cancel'
  },
  request_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  request_body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  response_status: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  response_body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  success: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'api_request_logs',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});
