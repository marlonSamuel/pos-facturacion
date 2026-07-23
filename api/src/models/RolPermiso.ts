import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export class RolPermiso extends Model {
  declare idrol_permiso: number;
  declare idrol: number;
  declare idpermiso: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

RolPermiso.init({
  idrol_permiso: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  idrol: { type: DataTypes.INTEGER, allowNull: false },
  idpermiso: { type: DataTypes.INTEGER, allowNull: false },
}, {
  sequelize,
  tableName: 'rol_permiso',
  timestamps: true,
});
