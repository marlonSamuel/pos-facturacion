import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const Permiso = sequelize.define('Permiso', {
  idpermiso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(30),
    allowNull: false
  }
}, {
  tableName: 'permiso',
  freezeTableName: true,
  timestamps: true
});
