import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { expressjwt } from 'express-jwt';
import { loadControllers } from 'awilix-express';
import loadContainer from './container';
import { sequelize } from './common/database/mysql';

export class Server {
  private app: express.Application;
  private server: http.Server;
  private port: number;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = parseInt(process.env.APP_PORT || '3000');

    // Database connection
    this.connectDatabase();

    // Middlewares
    this.middlewares();
  }

  private async connectDatabase(): Promise<void> {
    try {
      await sequelize.authenticate();
      console.log('✅ Base de datos conectada correctamente');
    } catch (error) {
      console.error('❌ Error de conexión a la base de datos:', error);
    }
  }

  private middlewares(): void {
    // CORS
    this.app.use(cors());

    // JSON body parser
    this.app.use(express.json());

    // DI Container (Awilix)
    loadContainer(this.app);

    // JWT Authentication
    const secretKey = process.env.JWT_SECRET_KEY;
    if (secretKey) {
      this.app.use(
        expressjwt({
          secret: secretKey,
          algorithms: ['HS256']
        }).unless({
          path: [
            '/api/check',
            '/api/auth/login',
            '/api/auth/refresh-token',
            { url: '/api/auth', methods: ['OPTIONS'] },
            { url: '/api/comercio/info', methods: ['GET'] },
            /^\/api\/comercio\/info\/.*/,
            /^\/uploads\/.*/
          ]
        })
      );
    }

    // Global unauthorized error handler
    this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err.name === 'UnauthorizedError') {
        res.status(err.status).send({ ok: false, message: err.message });
        return;
      }
      _next(err);
    });

    // Inyectar contexto multi-tenant (AsyncLocalStorage) — después de JWT
    const { injectRequestContext } = require('./common/middleware/context.middleware');
    this.app.use(injectRequestContext);

    // Static files (uploads)
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Load controllers with Awilix
    this.app.use('/api', loadControllers('controllers/*.ts', { cwd: __dirname }));
  }

  execute(): void {
    this.server.listen(this.port, () => {
      console.log(`🚀 Servidor corriendo en puerto ${this.port}`);
      console.log(`   Entorno: ${process.env.APP_ENV}`);
    });
  }
}
