import { Sequelize } from 'sequelize';
export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pos_db',
  timezone: '-06:00',
  logging: false,
  pool: {
    max: 200,
    min: 0,
    acquire: 30000,
    idle: 30000
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false,
    freezeTableName: true
  }
});
