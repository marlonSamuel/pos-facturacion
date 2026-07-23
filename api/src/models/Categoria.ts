import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const Categoria = sequelize.define('Categoria', {
  idcategoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(256),
    allowNull: true
  },
  condicion: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  idcomercio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'categoria',
  freezeTableName: true,
  timestamps: true
});
