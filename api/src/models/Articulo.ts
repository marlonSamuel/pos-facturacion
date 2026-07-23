import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const Articulo = sequelize.define('Articulo', {
  idarticulo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idcategoria: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(256),
    allowNull: true
  },
  imagen: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  precio_venta: {
    type: DataTypes.DECIMAL(11, 2),
    allowNull: true,
    defaultValue: null
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
  tableName: 'articulo',
  freezeTableName: true,
  timestamps: true
});
