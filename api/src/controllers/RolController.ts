import { GET, POST, PUT, DELETE, route, before } from 'awilix-express';
import { Response } from 'express';
import { check, param, body } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { RolService } from '../services/RolService';
import { AuditService } from '../services/AuditService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, AuthRequest } from '../common/middleware/auth.middleware';
@route('/roles')
export class RolController extends BaseController {
  constructor(private readonly rolService: RolService) {
    super();
  }
  @GET()
  @before([hasPermission('usuarios')])
  public async getAll(_req: AuthRequest, res: Response) {
    try {
      const data = await this.rolService.getAll();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @GET()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields,
  ])
  public async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.rolService.getById(id);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('usuarios'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
    check('descripcion').optional().isLength({ max: 255 }).withMessage('La descripción no puede exceder 255 caracteres'),
    body('permisos').isArray({ min: 1 }).withMessage('Debe asignar al menos un permiso'),
    body('permisos.*').isInt().withMessage('Cada permiso debe ser un número entero'),
    validateFields,
  ])
  public async create(req: AuthRequest, res: Response) {
    try {
      const data = await this.rolService.create(req.body);
      AuditService.registrar(req.auth?.username ?? null, 'CREAR', 'rol', (data as any)?.idrol, JSON.stringify(req.body), req.ip);
      res.status(201).send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @PUT()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
    check('descripcion').optional().isLength({ max: 255 }).withMessage('La descripción no puede exceder 255 caracteres'),
    body('permisos').isArray({ min: 1 }).withMessage('Debe asignar al menos un permiso'),
    body('permisos.*').isInt().withMessage('Cada permiso debe ser un número entero'),
    validateFields,
  ])
  public async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.rolService.update(id, req.body);
      AuditService.registrar(req.auth?.username ?? null, 'EDITAR', 'rol', id, JSON.stringify(req.body), req.ip);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @DELETE()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields,
  ])
  public async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const previous = await this.rolService.getById(id);
      const result = await this.rolService.delete(id);
      AuditService.registrar(req.auth?.username ?? null, 'ELIMINAR', 'rol', id, JSON.stringify(previous), req.ip);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

