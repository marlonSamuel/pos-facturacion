import { GET, route, before } from 'awilix-express';
import { Response } from 'express';
import { BaseController } from '../common/base/base.controller';
import { ReportsService } from '../services/ReportsService';
import { ReportsExportService } from '../services/ReportsExportService';
import { ComprehensiveReportService } from '../services/ComprehensiveReportService';
import { AuthRequest, hasPermission } from '../common/middleware/auth.middleware';
function parsePeriod(req: AuthRequest): { from: string; to: string } {
  const period = (req.query.period as string) || 'this-month';
  const now = new Date();
  switch (period) {
    case 'last-month': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: d.toISOString().slice(0, 10), to: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10) };
    }
    case 'this-year':
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    case 'last-year':
      return { from: `${now.getFullYear() - 1}-01-01`, to: `${now.getFullYear() - 1}-12-31` };
    case 'custom': {
      const from = (req.query.from as string) || `${now.getFullYear()}-01-01`;
      const to = (req.query.to as string) || new Date().toISOString().slice(0, 10);
      return { from, to };
    }
    default: // this-month
      return {
        from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
      };
  }
}
@route('/reports')
export class ReportsController extends BaseController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsExportService: ReportsExportService,
    private readonly comprehensiveReportService: ComprehensiveReportService,
  ) {
    super();
  }
  @route('/sales')
  @GET()
  @before([hasPermission('reportes-ventas')])
  public async getSales(req: AuthRequest, res: Response) {
    try {
      const from = (req.query.from as string) || '2000-01-01';
      const to = (req.query.to as string) || '2100-12-31';
      const cliente = req.query.cliente ? parseInt(req.query.cliente as string) : undefined;
      const tipo = req.query.tipo as string | undefined;
      const estado = req.query.estado as string | undefined;
      const data = await this.reportsService.getSales(from, to, cliente, tipo, estado);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/purchases')
  @GET()
  @before([hasPermission('reportes-compras')])
  public async getPurchases(req: AuthRequest, res: Response) {
    try {
      const from = (req.query.from as string) || '2000-01-01';
      const to = (req.query.to as string) || '2100-12-31';
      const proveedor = req.query.proveedor ? parseInt(req.query.proveedor as string) : undefined;
      const estado = req.query.estado as string | undefined;
      const data = await this.reportsService.getPurchases(from, to, proveedor, estado);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/dte-invoices')
  @GET()
  @before([hasPermission('reportes-ventas')])
  public async getDteInvoices(req: AuthRequest, res: Response) {
    try {
      const from = (req.query.from as string) || '2000-01-01';
      const to = (req.query.to as string) || '2100-12-31';
      const cliente = req.query.cliente ? parseInt(req.query.cliente as string) : undefined;
      const estado = req.query.estado as string | undefined;
      const data = await this.reportsService.getDteInvoices(from, to, cliente, estado);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/purchases-vs-sales/:year')
  @GET()
  @before([hasPermission('dashboard')])
  public async getPurchasesVsSales(req: AuthRequest, res: Response) {
    try {
      const year = parseInt(req.params.year as string) || new Date().getFullYear();
      const data = await this.reportsService.getPurchasesVsSales(year);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/top-products')
  @GET()
  @before([hasPermission('reportes-ventas')])
  public async getTopProducts(req: AuthRequest, res: Response) {
    try {
      const from = (req.query.from as string) || '2000-01-01';
      const to = (req.query.to as string) || '2100-12-31';
      const categoria = req.query.categoria ? parseInt(req.query.categoria as string) : undefined;
      const data = await this.reportsService.getTopProducts(from, to, categoria);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/inventory')
  @GET()
  @before([hasPermission('inventario')])
  public async getInventory(req: AuthRequest, res: Response) {
    try {
      const categoria = req.query.categoria ? parseInt(req.query.categoria as string) : undefined;
      const stockMin = req.query.stockMin !== undefined ? parseInt(req.query.stockMin as string) : undefined;
      const data = await this.reportsService.getInventory(categoria, stockMin);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/comprehensive/export')
  @GET()
  @before([hasPermission('dashboard')])
  public async exportComprehensive(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const buffer = await this.comprehensiveReportService.generate(from, to);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="resumen-completo-${req.query.period || 'this-month'}-${Date.now()}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/comprehensive/summary')
  @GET()
  @before([hasPermission('dashboard')])
  public async getSummary(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.comprehensiveReportService.getSummary(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/low-stock')
  @GET()
  @before([hasPermission('inventario')])
  public async getLowStock(req: AuthRequest, res: Response) {
    try {
      const threshold = parseInt(req.query.threshold as string) || 5;
      const categoria = req.query.categoria ? parseInt(req.query.categoria as string) : undefined;
      const data = await this.reportsService.getLowStock(threshold, categoria);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  // âââ Export âââ
  private columnDefs: Record<string, {
    title: string;
    columns: { header: string; key: string; width?: number; align?: 'left' | 'center' | 'right'; format?: (v: any, row: any) => string }[];
    footer: (data: any[]) => string;
  }> = {
    sales: {
      title: 'Reporte de Ventas',
      columns: [
        { header: 'Fecha', key: 'fecha_hora', width: 14, format: v => v ? new Date(v).toLocaleDateString('es-GT') : '' },
        { header: 'Tipo', key: 'tipo_comprobante', width: 10 },
        { header: 'Documento', key: 'documento', width: 16, format: (_, r) => `${r.serie_comprobante || ''}${r.num_comprobante || ''}` },
        { header: 'Cliente', key: 'cliente', width: 26 },
        { header: 'Total', key: 'total_venta', width: 14, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
        { header: 'Estado', key: 'estado', width: 10 },
        { header: 'Motivo', key: 'motivo_anulacion', width: 16, format: v => v || '-' },
        { header: 'Usuario', key: 'usuario', width: 14 },
      ],
      footer: data => `Total: Q${data.reduce((s: number, r: any) => s + parseFloat(r.total_venta || 0), 0).toFixed(2)} â ${data.length} registros`,
    },
    purchases: {
      title: 'Reporte de Compras',
      columns: [
        { header: 'Fecha', key: 'fecha_hora', width: 14, format: v => v ? new Date(v).toLocaleDateString('es-GT') : '' },
        { header: 'Tipo', key: 'tipo_comprobante', width: 10 },
        { header: 'Documento', key: 'documento', width: 16, format: (_, r) => `${r.serie_comprobante || ''}${r.num_comprobante || ''}` },
        { header: 'Proveedor', key: 'proveedor', width: 26 },
        { header: 'Total', key: 'total_compra', width: 14, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
        { header: 'Estado', key: 'estado', width: 10 },
        { header: 'Motivo', key: 'motivo_anulacion', width: 16, format: v => v || '-' },
      ],
      footer: data => `Total: Q${data.reduce((s: number, r: any) => s + parseFloat(r.total_compra || 0), 0).toFixed(2)} â ${data.length} registros`,
    },
    'dte-invoices': {
      title: 'Facturas DTE',
      columns: [
        { header: 'Autorización', key: 'autorizacion', width: 22 },
        { header: 'Serie', key: 'serie', width: 8 },
        { header: 'No.', key: 'numero', width: 8 },
        { header: 'NIT', key: 'nit_comprador', width: 14 },
        { header: 'Comprador', key: 'nombre_comprador', width: 22 },
        { header: 'Total', key: 'total', width: 12, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
        { header: 'IVA', key: 'impuesto', width: 10, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
        { header: 'Estado', key: 'estado_dte', width: 10, format: v => v === 0 ? 'Activa' : 'Anulada' },
      ],
      footer: data => `Total: Q${data.reduce((s: number, r: any) => s + parseFloat(r.total || 0), 0).toFixed(2)} | IVA: Q${data.reduce((s: number, r: any) => s + parseFloat(r.impuesto || 0), 0).toFixed(2)} â ${data.length} facturas`,
    },
    'purchases-vs-sales': {
      title: 'Comparativo Compras vs Ventas',
      columns: [
        { header: 'Mes', key: 'mes', width: 10, format: v => ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][v - 1] || '' },
        { header: 'Ventas', key: 'total_venta', width: 16, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
        { header: 'Compras', key: 'total_compra', width: 16, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
        { header: 'Diferencia', key: 'diferencia', width: 16, align: 'right', format: (v, r) => `Q${(parseFloat(r.total_venta || 0) - parseFloat(r.total_compra || 0)).toFixed(2)}` },
      ],
      footer: data => `Ventas: Q${data.reduce((s: number, r: any) => s + parseFloat(r.total_venta || 0), 0).toFixed(2)} | Compras: Q${data.reduce((s: number, r: any) => s + parseFloat(r.total_compra || 0), 0).toFixed(2)}`,
    },
    'low-stock': {
      title: 'Stock Mínimo',
      columns: [
        { header: 'Código', key: 'codigo', width: 14 },
        { header: 'Producto', key: 'nombre', width: 28 },
        { header: 'Categoría', key: 'categoria', width: 16 },
        { header: 'Stock', key: 'stock', width: 10, align: 'center', format: v => String(v) },
        { header: 'Precio', key: 'precio_venta', width: 14, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
      ],
      footer: data => `${data.length} producto(s) con stock bajo`,
    },
    'top-products': {
      title: 'Productos más Vendidos',
      columns: [
        { header: 'Código', key: 'codigo', width: 12 },
        { header: 'Producto', key: 'nombre', width: 24 },
        { header: 'Categoría', key: 'categoria', width: 14 },
        { header: 'Cant.', key: 'cantidad_vendida', width: 10, align: 'center', format: v => String(v) },
        { header: 'Ventas', key: 'num_ventas', width: 10, align: 'center', format: v => String(v) },
        { header: 'Total', key: 'total_vendido', width: 14, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
      ],
      footer: data => `${data.length} productos â ${data.reduce((s: number, r: any) => s + parseInt(r.cantidad_vendida || 0), 0)} unidades | Q${data.reduce((s: number, r: any) => s + parseFloat(r.total_vendido || 0), 0).toFixed(2)}`,
    },
    'inventory': {
      title: 'Inventario',
      columns: [
        { header: 'Código', key: 'codigo', width: 14 },
        { header: 'Producto', key: 'nombre', width: 28 },
        { header: 'Categoría', key: 'categoria', width: 16 },
        { header: 'Stock', key: 'stock', width: 10, align: 'center', format: v => String(v) },
        { header: 'Precio', key: 'precio_venta', width: 14, align: 'right', format: v => `Q${Number(v).toFixed(2)}` },
      ],
      footer: data => `${data.length} productos | ${data.reduce((s: number, r: any) => s + parseInt(r.stock || 0), 0)} unidades | Valor: Q${data.reduce((s: number, r: any) => s + parseFloat(r.stock || 0) * parseFloat(r.precio_venta || 0), 0).toFixed(2)}`,
    },
  };
  @route('/export/:type')
  @GET()
  @before([hasPermission('reportes-ventas')])
  public async exportReport(req: AuthRequest, res: Response) {
    try {
      const reportType = String(req.params.type);
      const format = (req.query.format as string) || 'pdf';
      const from = (req.query.from as string) || '2000-01-01';
      const to = (req.query.to as string) || '2100-12-31';
      let rows: any[] = [];
      const def = (this.columnDefs as any)[reportType];
      if (!def) return res.status(400).send({ error: 'Tipo de reporte inválido' });
      switch (reportType) {
        case 'sales': {
          const cliente = req.query.cliente ? parseInt(req.query.cliente as string) : undefined;
          const tipo = req.query.tipo as string | undefined;
          const estado = req.query.estado as string | undefined;
          const r = await this.reportsService.getSales(from, to, cliente, tipo, estado);
          rows = r.rows.map((row: any) => ({ ...row, documento: `${row.serie_comprobante || ''}${row.num_comprobante || ''}` }));
          break;
        }
        case 'purchases': {
          const proveedor = req.query.proveedor ? parseInt(req.query.proveedor as string) : undefined;
          const estado = req.query.estado as string | undefined;
          const r = await this.reportsService.getPurchases(from, to, proveedor, estado);
          rows = r.rows.map((row: any) => ({ ...row, documento: `${row.serie_comprobante || ''}${row.num_comprobante || ''}` }));
          break;
        }
        case 'dte-invoices': {
          const cliente = req.query.cliente ? parseInt(req.query.cliente as string) : undefined;
          const estado = req.query.estado as string | undefined;
          const r = await this.reportsService.getDteInvoices(from, to, cliente, estado);
          rows = r.rows;
          break;
        }
        case 'purchases-vs-sales': {
          const year = parseInt(req.query.year as string) || new Date().getFullYear();
          const r = await this.reportsService.getPurchasesVsSales(year);
          rows = r.rows.map((row: any) => ({ ...row, diferencia: row.total_venta - row.total_compra }));
          break;
        }
        case 'low-stock': {
          const threshold = parseInt(req.query.threshold as string) || 5;
          const categoria = req.query.categoria ? parseInt(req.query.categoria as string) : undefined;
          const r = await this.reportsService.getLowStock(threshold, categoria);
          rows = r.rows;
          break;
        }
        case 'top-products': {
          const categoria = req.query.categoria ? parseInt(req.query.categoria as string) : undefined;
          const r = await this.reportsService.getTopProducts(from, to, categoria);
          rows = r.rows;
          break;
        }
        case 'inventory': {
          const categoria = req.query.categoria ? parseInt(req.query.categoria as string) : undefined;
          const stockMin = req.query.stockMin !== undefined ? parseInt(req.query.stockMin as string) : undefined;
          const r = await this.reportsService.getInventory(categoria, stockMin);
          rows = r.rows;
          break;
        }
      }
      const footer = def.footer(rows);
      if (format === 'xlsx') {
        const buffer = await this.reportsExportService.toExcel(def.title, def.columns, rows, footer);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.xlsx"`);
        res.send(buffer);
      } else {
        const buffer = await this.reportsExportService.toPdf(def.title, def.columns, rows, footer);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${reportType}-${Date.now()}.pdf"`);
        res.send(buffer);
      }
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

