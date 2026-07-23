import { GET, POST, PUT, DELETE, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check, param } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { CategoryService } from '../services/CategoryService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, AuthRequest } from '../common/middleware/auth.middleware';
import { AuditService } from '../services/AuditService';
@route('/categories')
export class CategoryController extends BaseController {
  constructor(private readonly categoryService: CategoryService) {
    super();
  }
  @GET()
  @before([hasPermission('ventas')])
  public async getAll(_req: Request, res: Response) {
    try {
      const data = await this.categoryService.getAll();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/all')
  @GET()
  @before([hasPermission('inventario')])
  public async getAllIncludingInactive(_req: Request, res: Response) {
    try {
      const data = await this.categoryService.getAllIncludingInactive();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @GET()
  @before([
    hasPermission('inventario'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.categoryService.getById(id);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('inventario'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
    check('descripcion').optional().isLength({ max: 256 }).withMessage('La descripción no puede exceder 256 caracteres'),
    validateFields
  ])
  public async create(req: AuthRequest, res: Response) {
    try {
      const data = await this.categoryService.create(req.body);
      AuditService.registrar(req.auth?.username || null, 'CREAR', 'categoria', (data as any)?.idcategoria, JSON.stringify(req.body), req.ip);
      res.status(201).send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @PUT()
  @before([
    hasPermission('inventario'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
    check('descripcion').optional().isLength({ max: 256 }).withMessage('La descripción no puede exceder 256 caracteres'),
    validateFields
  ])
  public async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.categoryService.update(id, req.body);
      AuditService.registrar(req.auth?.username || null, 'EDITAR', 'categoria', id, JSON.stringify(req.body), req.ip);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @DELETE()
  @before([
    hasPermission('inventario'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      // Obtener datos antes de eliminar para auditoría
      const previous = await this.categoryService.getById(id);
      const result = await this.categoryService.delete(id);
      AuditService.registrar(req.auth?.username || null, 'ELIMINAR', 'categoria', id, JSON.stringify(previous), req.ip);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

