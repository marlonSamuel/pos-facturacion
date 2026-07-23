import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../common/database/mysql';

export class BitacoraLog extends Model {
  declare idbitacora: number;
  declare usuario: string | null;
  declare accion: string;
  declare tabla: string | null;
  declare registro_id: number | null;
  declare detalle: string | null;
  declare ip: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

BitacoraLog.init({
  idbitacora: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario: { type: DataTypes.STRING(100), allowNull: true },
  accion: { type: DataTypes.STRING(50), allowNull: false },
  tabla: { type: DataTypes.STRING(50), allowNull: true },
  registro_id: { type: DataTypes.INTEGER, allowNull: true },
  detalle: { type: DataTypes.TEXT, allowNull: true },
  ip: { type: DataTypes.STRING(45), allowNull: true },
}, {
  sequelize,
  tableName: 'bitacora_logs',
  timestamps: true,
});
