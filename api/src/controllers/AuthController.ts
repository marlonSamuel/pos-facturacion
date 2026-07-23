import { POST, GET, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { AuthService } from '../services/AuthService';
import { AuditService } from '../services/AuditService';
import { validateFields } from '../common/middleware/validate-fields';
import { AuthRequest } from '../common/middleware/auth.middleware';
@route('/auth')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }
  @route('/login')
  @POST()
  @before([
    check('username').notEmpty().withMessage('El usuario es requerido'),
    check('password').notEmpty().withMessage('La contraseña es requerida'),
    validateFields
  ])
  public async login(req: Request, res: Response) {
    try {
      const result = await this.authService.login(req.body);
      if (!result.ok) {
        return res.status(401).send(result);
      }
      AuditService.registrar(req.body?.username ?? null, 'LOGIN_OK', 'usuario', undefined, undefined, req.ip);
      res.send(result);
    } catch (error) {
      AuditService.registrar(req.body?.username ?? null, 'LOGIN_FAIL', 'usuario', undefined, error instanceof Error ? error.message : 'Error desconocido', req.ip);
      this.handleException(error, res);
    }
  }
  @route('/me')
  @GET()
  public async me(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.id;
      if (!userId) {
        return res.status(401).send({ ok: false, message: 'No autenticado' });
      }
      const user = await this.authService.verifyToken(userId);
      // Incluir idsucursal desde el JWT actual
      res.send({ ...user, idsucursal: req.auth?.idsucursal ?? null });
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/refresh-token')
  @POST()
  @before([
    check('refreshToken').notEmpty().withMessage('Refresh token requerido'),
    validateFields
  ])
  public async refreshToken(req: Request, res: Response) {
    try {
      const result = await this.authService.refreshAccessToken(req.body.refreshToken);
      if (!result.ok) {
        return res.status(401).send(result);
      }
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/cambiar-sucursal')
  @POST()
  @before([
    check('idsucursal').isInt().withMessage('Sucursal inválida'),
    validateFields
  ])
  public async cambiarSucursal(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.id;
      if (!userId) return res.status(401).send({ ok: false, message: 'No autenticado' });
      const result = await this.authService.cambiarSucursal(userId, parseInt(req.body.idsucursal));
      res.send({ ok: true, ...result });
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

