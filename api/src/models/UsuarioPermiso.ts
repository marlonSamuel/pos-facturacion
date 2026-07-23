import { DataTypes } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export const UsuarioPermiso = sequelize.define('UsuarioPermiso', {
  idusuario_permiso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  idusuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  idpermiso: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'usuario_permiso',
  freezeTableName: true,
  timestamps: true
});
