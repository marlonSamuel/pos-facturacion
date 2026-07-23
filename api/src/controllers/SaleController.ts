import { GET, POST, PUT, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check, param, body } from 'express-validator';
import path from 'path';
import fs from 'fs';
import { BaseController } from '../common/base/base.controller';
import { SaleService } from '../services/SaleService';
import { PdfService } from '../services/PdfService';
import { AuditService } from '../services/AuditService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, AuthRequest } from '../common/middleware/auth.middleware';
@route('/sales')
export class SaleController extends BaseController {
  constructor(
    private readonly saleService: SaleService,
    private readonly pdfService: PdfService
  ) {
    super();
  }
  @GET()
  @before([hasPermission('ventas')])
  public async getAll(_req: Request, res: Response) {
    try {
      const data = await this.saleService.getAll();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/paginated')
  @GET()
  @before([hasPermission('ventas')])
  public async getAllPaginated(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const estado = req.query.estado as string | undefined;
      const data = await this.saleService.getAllPaginated(page, pageSize, estado);
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
      const data = await this.saleService.getById(id);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('ventas'),
    check('idcliente').isInt().withMessage('Cliente inválido'),
    check('tipo_comprobante').isIn(['Boleta', 'Ticket', 'Factura']).withMessage('Tipo comprobante inválido'),
    check('fecha_hora').notEmpty().withMessage('Fecha requerida'),
    check('total_venta').isDecimal().withMessage('Total debe ser un número'),
    check('detalles').isArray({ min: 1 }).withMessage('Debe incluir al menos un artículo'),
    body('detalles.*.idarticulo').isInt().withMessage('Artículo inválido'),
    body('detalles.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser â¥ 1'),
    body('detalles.*.precio_venta').isFloat({ min: 0.01 }).withMessage('Precio venta debe ser mayor a 0'),
    body('detalles.*.descuento').optional().isFloat({ min: 0 }).withMessage('Descuento no puede ser negativo'),
    validateFields
  ])
  public async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.id;
      if (!userId) return res.status(401).send({ ok: false, message: 'No autenticado' });
      const result = await this.saleService.create(req.body, userId, req.auth?.username, req.ip);
      AuditService.registrar(req.auth?.username ?? null, 'CREAR', 'venta', result?.idventa, JSON.stringify({ tipo: req.body.tipo_comprobante, total: req.body.total_venta }), req.ip);
      res.status(201).send({ ok: true, ...result });
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id/cancel')
  @PUT()
  @before([
    hasPermission('ventas'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async cancel(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const motivo = req.body?.motivo_anulacion as string | undefined;
      const result = await this.saleService.cancel(id, motivo, req.auth?.username, req.ip);
      AuditService.registrar(req.auth?.username ?? null, 'ANULAR', 'venta', id, undefined, req.ip);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id/pdf')
  @GET()
  @before([
    hasPermission('ventas'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async downloadPdf(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.saleService.getById(id);
      if (data.tipo_comprobante === 'Factura' || data.pdfUrl) {
        // Factura con DTE â servir PDF guardado
        if (!data.pdfUrl) {
          return res.status(404).send({ ok: false, message: 'No hay PDF disponible' });
        }
        const pdfPath = path.join(__dirname, '../../', data.pdfUrl.replace(/^\//, ''));
        if (!fs.existsSync(pdfPath)) {
          return res.status(404).send({ ok: false, message: 'Archivo PDF no encontrado' });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${data.tipo_comprobante}-${data.idventa}.pdf"`);
        return res.sendFile(pdfPath);
      }
      // Boleta/Ticket â generar PDF con PDFKit
      const pdfBuffer = await this.pdfService.generateDocument(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${data.tipo_comprobante}-${data.idventa}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

