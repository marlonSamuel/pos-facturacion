import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const Usuario = sequelize.define('Usuario', {
  idusuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tipo_documento: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  num_documento: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING(70),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  login: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  clave: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  imagen: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  condicion: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  idrol: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  idcomercio: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'usuario',
  freezeTableName: true,
  timestamps: true
});
