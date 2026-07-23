import { GET, POST, PUT, DELETE, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check, param } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { ArticleService } from '../services/ArticleService';
import { AuditService } from '../services/AuditService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, AuthRequest } from '../common/middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
// Configuración de multer
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads/products'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});
@route('/articles')
export class ArticleController extends BaseController {
  constructor(private readonly articleService: ArticleService) {
    super();
  }
  @GET()
  @before([hasPermission('inventario')])
  public async getAll(_req: Request, res: Response) {
    try {
      const data = await this.articleService.getAll();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/paginated')
  @GET()
  @before([hasPermission('inventario')])
  public async getAllPaginated(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const includeInactive = req.query.all === 'true';
      const data = await this.articleService.getAllPaginated(page, pageSize, includeInactive);
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
      const data = await this.articleService.getAllIncludingInactive();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/search')
  @GET()
  @before([hasPermission('ventas')])
  public async search(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const data = await this.articleService.search(q, limit, offset, categoryId);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/active-for-sale')
  @GET()
  @before([hasPermission('ventas')])
  public async getActiveForSale(_req: Request, res: Response) {
    try {
      const data = await this.articleService.getActiveForSale();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id/last-purchase-price')
  @GET()
  @before([
    hasPermission('inventario'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async getLastPurchasePrice(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.articleService.getLastPurchasePrice(id);
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
      const data = await this.articleService.getById(id);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('inventario'),
    upload.single('imagen'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    check('idcategoria').notEmpty().withMessage('La categoría es requerida')
      .isInt().withMessage('La categoría debe ser un número entero'),
    check('codigo').optional({ values: 'falsy' })
      .isLength({ max: 50 }).withMessage('El código no puede exceder 50 caracteres'),
    check('precio_venta').notEmpty().withMessage('El precio de venta es requerido')
      .isFloat({ min: 0.01 }).withMessage('El precio de venta debe ser mayor a 0'),
    check('descripcion').optional({ values: 'falsy' })
      .isLength({ max: 256 }).withMessage('La descripción no puede exceder 256 caracteres'),
    validateFields
  ])
  public async create(req: AuthRequest, res: Response) {
    try {
      const imagen = req.file?.filename;
      const data = await this.articleService.create(req.body, imagen);
      AuditService.registrar(req.auth?.username ?? null, 'CREAR', 'articulo', (data as any)?.idarticulo, JSON.stringify(req.body), req.ip);
      res.status(201).send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @PUT()
  @before([
    hasPermission('inventario'),
    upload.single('imagen'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    check('idcategoria').notEmpty().withMessage('La categoría es requerida')
      .isInt().withMessage('La categoría debe ser un número entero'),
    check('codigo').optional({ values: 'falsy' })
      .isLength({ max: 50 }).withMessage('El código no puede exceder 50 caracteres'),
    check('precio_venta').notEmpty().withMessage('El precio de venta es requerido')
      .isFloat({ min: 0.01 }).withMessage('El precio de venta debe ser mayor a 0'),
    check('descripcion').optional({ values: 'falsy' })
      .isLength({ max: 256 }).withMessage('La descripción no puede exceder 256 caracteres'),
    validateFields
  ])
  public async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const imagen = req.file?.filename;
      const data = await this.articleService.update(id, req.body, imagen);
      AuditService.registrar(req.auth?.username ?? null, 'EDITAR', 'articulo', id, JSON.stringify(req.body), req.ip);
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
      const previous = await this.articleService.getById(id);
      const result = await this.articleService.delete(id);
      AuditService.registrar(req.auth?.username ?? null, 'ELIMINAR', 'articulo', id, JSON.stringify(previous), req.ip);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

