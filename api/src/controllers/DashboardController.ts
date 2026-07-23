import { GET, route, before } from 'awilix-express';
import { Response } from 'express';
import { BaseController } from '../common/base/base.controller';
import { DashboardService } from '../services/DashboardService';
import { AuthRequest, hasPermission } from '../common/middleware/auth.middleware';
@route('/dashboard')
export class DashboardController extends BaseController {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }
  /** Métricas de ventas y compras del día */
  @route('/sales-summary')
  @GET()
  @before([hasPermission('dashboard')])
  public async getSalesSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.idrol === 1 ? undefined : req.auth?.id;
      const data = await this.dashboardService.getSalesSummary(userId);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  /** Resumen de facturación DTE del mes */
  @route('/dte-summary')
  @GET()
  @before([hasPermission('dashboard')])
  public async getDteSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.idrol === 1 ? undefined : req.auth?.id;
      const data = await this.dashboardService.getDteSummary(userId);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  /** Catálogo: totales + stock bajo */
  @route('/catalog')
  @GET()
  @before([hasPermission('dashboard')])
  public async getCatalog(_req: AuthRequest, res: Response) {
    try {
      const data = await this.dashboardService.getCatalog();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  /** Tendencias: ventas por mes, top productos, últimas ventas */
  @route('/trends')
  @GET()
  @before([hasPermission('dashboard')])
  public async getTrends(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.idrol === 1 ? undefined : req.auth?.id;
      const data = await this.dashboardService.getTrends(userId);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

