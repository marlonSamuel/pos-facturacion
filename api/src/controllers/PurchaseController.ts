import { GET, POST, PUT, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check, param, body } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { PurchaseService } from '../services/PurchaseService';
import { AuditService } from '../services/AuditService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, AuthRequest } from '../common/middleware/auth.middleware';
@route('/purchases')
export class PurchaseController extends BaseController {
  constructor(private readonly purchaseService: PurchaseService) {
    super();
  }
  @GET()
  @before([hasPermission('compras')])
  public async getAll(_req: Request, res: Response) {
    try {
      const data = await this.purchaseService.getAll();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/paginated')
  @GET()
  @before([hasPermission('compras')])
  public async getAllPaginated(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const estado = req.query.estado as string | undefined;
      const data = await this.purchaseService.getAllPaginated(page, pageSize, estado);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @GET()
  @before([
    hasPermission('compras'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.purchaseService.getById(id);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('compras'),
    check('idproveedor').isInt().withMessage('Proveedor inválido'),
    check('tipo_comprobante').notEmpty().withMessage('Tipo comprobante requerido'),
    check('num_comprobante').notEmpty().withMessage('No. comprobante requerido')
      .isLength({ max: 10 }).withMessage('Máximo 10 caracteres'),
    check('fecha_hora').notEmpty().withMessage('Fecha requerida'),
    check('total_compra').isDecimal().withMessage('Total debe ser un número'),
    check('detalles').isArray({ min: 1 }).withMessage('Debe incluir al menos un artículo'),
    body('detalles.*.idarticulo').isInt().withMessage('Artículo inválido'),
    body('detalles.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser â¥ 1'),
    body('detalles.*.precio_compra').isFloat({ min: 0.01 }).withMessage('Precio compra debe ser mayor a 0'),

    validateFields
  ])
  public async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.id;
      if (!userId) return res.status(401).send({ ok: false, message: 'No autenticado' });
      const data = await this.purchaseService.create(req.body, userId);
      AuditService.registrar(req.auth?.username ?? null, 'CREAR', 'ingreso', (data as any)?.idingreso, JSON.stringify({ total: req.body.total_compra, proveedor: req.body.idproveedor }), req.ip);
      res.status(201).send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id/cancel')
  @PUT()
  @before([
    hasPermission('compras'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async cancel(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const motivo = req.body?.motivo_anulacion as string | undefined;
      const result = await this.purchaseService.cancel(id, motivo);
      AuditService.registrar(req.auth?.username ?? null, 'ANULAR', 'ingreso', id, undefined, req.ip);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

