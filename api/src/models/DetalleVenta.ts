import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const DetalleVenta = sequelize.define('DetalleVenta', {
  iddetalle_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idventa: {
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
  precio_venta: {
    type: DataTypes.DECIMAL(11, 2),
    allowNull: false
  },
  descuento: {
    type: DataTypes.DECIMAL(11, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  tableName: 'detalle_venta',
  freezeTableName: true,
  timestamps: true
});
