import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const TokenDte = sequelize.define('TokenDte', {
  id_token: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idsucursal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Sucursal que generó el token — cada sucursal tiene su propio token'
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expira_en: {
    type: DataTypes.DATE,
    allowNull: false
  },
  otorgado_a: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'token_dte',
  freezeTableName: true,
  timestamps: true
});
