import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const Sucursal = sequelize.define('Sucursal', {
  idsucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idcomercio: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  condicion: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  principal: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  nit: {
    type: DataTypes.STRING(16),
    allowNull: true
  },
  nombre_emisor: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  nombre_comercial: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  direccion_emisor: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  codigo_postal: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  municipio: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  departamento: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  pais: {
    type: DataTypes.STRING(5),
    allowNull: true,
    defaultValue: 'GT'
  },
  regimen: {
    type: DataTypes.ENUM('GEN', 'PEQ'),
    allowNull: false,
    defaultValue: 'GEN'
  },
  usuario_digifact: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  usuario_login: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Usuario completo para login API Digifact (ej: GT.000044653948.PRUEBAS56)'
  },
  password_digifact: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  codigo_establecimiento: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  codigo_pos: {
    type: DataTypes.STRING(4),
    allowNull: true
  }
}, {
  tableName: 'sucursal',
  freezeTableName: true,
  timestamps: true
});
