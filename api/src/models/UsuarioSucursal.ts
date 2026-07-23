import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const UsuarioSucursal = sequelize.define('UsuarioSucursal', {
  idusuario_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idusuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  idsucursal: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'usuario_sucursal',
  freezeTableName: true,
  timestamps: false
});
