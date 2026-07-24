import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const DetalleIngreso = sequelize.define('DetalleIngreso', {
  iddetalle_ingreso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idingreso: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  idarticulo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio_compra: {
    type: DataTypes.DECIMAL(11, 2),
    allowNull: false
  }
}, {
  tableName: 'detalle_ingreso',
  freezeTableName: true,
  timestamps: true
});
