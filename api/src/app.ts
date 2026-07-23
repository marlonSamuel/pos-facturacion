process.env.APP_ENV = process.env.APP_ENV || 'development';

import dotenv from 'dotenv';

dotenv.config({
  path: `${__dirname}/../config/${process.env.APP_ENV}.env`
});

import { Server } from './server';

process.env.TZ = 'America/Guatemala';

const server = new Server();
server.execute();
