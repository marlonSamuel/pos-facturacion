import { GET, POST, PUT, DELETE, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check, param } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { SucursalService } from '../services/SucursalService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, requireSucursal, AuthRequest } from '../common/middleware/auth.middleware';
@route('/sucursales')
export class SucursalController extends BaseController {
  constructor(private readonly sucursalService: SucursalService) {
    super();
  }
  @GET()
  @before([requireSucursal])
  public async getAll(req: AuthRequest, res: Response) {
    try {
      const idcomercio = req.auth?.idcomercio;
      if (!idcomercio) return res.status(400).send({ ok: false, message: 'Comercio no identificado' });
      const data = await this.sucursalService.getAll(idcomercio);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @GET()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('ID inválido'),
    validateFields
  ])
  public async getById(req: Request, res: Response) {
    try {
      const data = await this.sucursalService.getById(parseInt(req.params.id as string));
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('usuarios'),
    check('nombre').notEmpty().withMessage('Nombre requerido'),
    check('idcomercio').isInt().withMessage('Comercio inválido'),
    validateFields
  ])
  public async create(req: Request, res: Response) {
    try {
      const data = await this.sucursalService.create(req.body);
      res.status(201).send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @PUT()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('ID inválido'),
    validateFields
  ])
  public async update(req: Request, res: Response) {
    try {
      const data = await this.sucursalService.update(parseInt(req.params.id as string), req.body);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @DELETE()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('ID inválido'),
    validateFields
  ])
  public async delete(req: Request, res: Response) {
    try {
      const data = await this.sucursalService.delete(parseInt(req.params.id as string));
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

