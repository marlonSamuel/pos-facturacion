import { GET, POST, PUT, DELETE, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check, param } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { PersonService } from '../services/PersonService';
import { AuditService } from '../services/AuditService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, AuthRequest } from '../common/middleware/auth.middleware';
@route('/persons')
export class PersonController extends BaseController {
  constructor(private readonly personService: PersonService) {
    super();
  }
  @route('/clients')
  @GET()
  @before([hasPermission('ventas')])
  public async getClients(_req: Request, res: Response) {
    try {
      const data = await this.personService.getAll('Cliente');
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/providers')
  @GET()
  @before([hasPermission('compras')])
  public async getProviders(_req: Request, res: Response) {
    try {
      const data = await this.personService.getAll('Proveedor');
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @GET()
  @before([
    hasPermission('ventas'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.personService.getById(id);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('ventas'),
    check('tipo_persona').isIn(['Cliente', 'Proveedor']).withMessage('Tipo inválido (Cliente/Proveedor)'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    check('tipo_documento').optional({ values: 'falsy' })
      .isIn(['NIT', 'CF', 'DPI']).withMessage('Tipo documento inválido (NIT/CF/DPI)'),
    check('num_documento').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('No. documento no puede exceder 20 caracteres'),
    check('direccion').optional({ values: 'falsy' })
      .isLength({ max: 70 }).withMessage('Dirección no puede exceder 70 caracteres'),
    check('telefono').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('Teléfono no puede exceder 20 caracteres'),
    check('email').optional({ values: 'falsy' })
      .isEmail().withMessage('Correo electrónico inválido')
      .isLength({ max: 50 }).withMessage('Email no puede exceder 50 caracteres'),
    validateFields
  ])
  public async create(req: AuthRequest, res: Response) {
    try {
      const data = await this.personService.create(req.body);
      AuditService.registrar(req.auth?.username ?? null, 'CREAR', 'persona', (data as any)?.idpersona, JSON.stringify(req.body), req.ip);
      res.status(201).send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @PUT()
  @before([
    hasPermission('ventas'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    check('tipo_persona').isIn(['Cliente', 'Proveedor']).withMessage('Tipo inválido (Cliente/Proveedor)'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    check('tipo_documento').optional({ values: 'falsy' })
      .isIn(['NIT', 'CF', 'DPI']).withMessage('Tipo documento inválido (NIT/CF/DPI)'),
    check('num_documento').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('No. documento no puede exceder 20 caracteres'),
    check('direccion').optional({ values: 'falsy' })
      .isLength({ max: 70 }).withMessage('Dirección no puede exceder 70 caracteres'),
    check('telefono').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('Teléfono no puede exceder 20 caracteres'),
    check('email').optional({ values: 'falsy' })
      .isEmail().withMessage('Correo electrónico inválido')
      .isLength({ max: 50 }).withMessage('Email no puede exceder 50 caracteres'),
    validateFields
  ])
  public async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.personService.update(id, req.body);
      AuditService.registrar(req.auth?.username ?? null, 'EDITAR', 'persona', id, JSON.stringify(req.body), req.ip);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @DELETE()
  @before([
    hasPermission('ventas'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const previous = await this.personService.getById(id);
      const result = await this.personService.delete(id);
      AuditService.registrar(req.auth?.username ?? null, 'ELIMINAR', 'persona', id, JSON.stringify(previous), req.ip);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

