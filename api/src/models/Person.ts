import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const Person = sequelize.define('Person', {
  idpersona: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  tipo_persona: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tipo_documento: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  num_documento: {
    type: DataTypes.STRING(20),
    allowNull: true
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
  idcomercio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'persona',
  freezeTableName: true,
  timestamps: true
});
