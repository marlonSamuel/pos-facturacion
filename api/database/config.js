// Sequelize CLI config - lee variables de entorno
// Usa dotenv para cargar el archivo .env correcto
const dotenv = require('dotenv');
const path = require('path');

const env = process.env.APP_ENV || 'development';
dotenv.config({ path: path.resolve(__dirname, '..', 'config', `${env}.env`) });

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pos_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    timezone: '-06:00',
    logging: false
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pos_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    timezone: '-06:00',
    logging: false
  }
};
