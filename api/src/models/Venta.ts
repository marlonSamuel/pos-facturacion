import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const Venta = sequelize.define('Venta', {
  idventa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idcliente: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  idusuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_comprobante: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  serie_comprobante: {
    type: DataTypes.STRING(7),
    allowNull: true
  },
  num_comprobante: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false
  },
  impuesto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_venta: {
    type: DataTypes.DECIMAL(11, 2),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Aceptado'
  },
  tipo_venta: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'CA'
  },
  idsucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  motivo_anulacion: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'venta',
  freezeTableName: true,
  timestamps: true
});
