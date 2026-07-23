import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const ArticuloSucursal = sequelize.define('ArticuloSucursal', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idarticulo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  idsucursal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'articulo_sucursal',
  freezeTableName: true,
  timestamps: true
});
