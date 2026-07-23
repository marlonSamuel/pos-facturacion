import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export class Rol extends Model {
  declare idrol: number;
  declare nombre: string;
  declare descripcion: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Rol.init({
  idrol: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  descripcion: { type: DataTypes.STRING(255), allowNull: true },
}, {
  sequelize,
  tableName: 'rol',
  timestamps: true,
});
