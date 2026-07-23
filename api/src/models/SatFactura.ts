import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const SatFactura = sequelize.define('SatFactura', {
  idfactura: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idventa: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  AcuseReciboSAT: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  autorizacion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  serie: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  fecha_dt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nit_eface: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  nombre_eface: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  nit_comprador: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  nombre_comprador: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  backprocesor: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fecha_certificacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ResponseDATA1: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  ResponseDATA2: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  ResponseDATA3: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total: {
    type: DataTypes.DECIMAL(11, 2),
    allowNull: true
  },
  impuesto: {
    type: DataTypes.DECIMAL(11, 2),
    allowNull: true
  }
}, {
  tableName: 'sat_facturas',
  freezeTableName: true,
  timestamps: true
});
