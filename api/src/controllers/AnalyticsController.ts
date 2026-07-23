import { GET, route, before } from 'awilix-express';
import { Response } from 'express';
import { BaseController } from '../common/base/base.controller';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthRequest, hasPermission } from '../common/middleware/auth.middleware';
function parsePeriod(req: AuthRequest): { from: string; to: string } {
  const period = (req.query.period as string) || 'this-month';
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const toStr = (d: Date) => d.toISOString().slice(0, 10);
  switch (period) {
    case 'today':
      return { from: toStr(now), to: toStr(now) };
    case 'this-week': {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1);
      return { from: toStr(start), to: toStr(now) };
    }
    case 'last-week': {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay() - 6);
      const end = new Date(now); end.setDate(now.getDate() - now.getDay());
      return { from: toStr(start), to: toStr(end) };
    }
    case 'this-month':
      return { from: `${y}-${String(m + 1).padStart(2, '0')}-01`, to: toStr(now) };
    case 'last-month': {
      const d = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      return { from: toStr(d), to: toStr(lastDay) };
    }
    case 'this-quarter': {
      const q = Math.floor(m / 3) * 3;
      return { from: `${y}-${String(q + 1).padStart(2, '0')}-01`, to: toStr(now) };
    }
    case 'this-year':
      return { from: `${y}-01-01`, to: toStr(now) };
    case 'custom': {
      const from = (req.query.from as string) || `${y}-01-01`;
      const to = (req.query.to as string) || toStr(now);
      return { from, to };
    }
    default:
      return { from: `${y}-${String(m + 1).padStart(2, '0')}-01`, to: toStr(now) };
  }
}
@route('/analytics')
export class AnalyticsController extends BaseController {
  constructor(private readonly analyticsService: AnalyticsService) {
    super();
  }
  @route('/overview')
  @GET()
  @before([hasPermission('dashboard')])
  public async getOverview(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getOverview(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/daily')
  @GET()
  @before([hasPermission('dashboard')])
  public async getDaily(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getDailyTrend(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/weekly')
  @GET()
  @before([hasPermission('dashboard')])
  public async getWeekly(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getWeeklyComparison(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/top-products')
  @GET()
  @before([hasPermission('dashboard')])
  public async getTopProducts(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await this.analyticsService.getTopProducts(from, to, limit);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/sales-by-type')
  @GET()
  @before([hasPermission('dashboard')])
  public async getSalesByType(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getSalesByType(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/category-breakdown')
  @GET()
  @before([hasPermission('dashboard')])
  public async getCategoryBreakdown(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getCategoryBreakdown(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/day-of-week')
  @GET()
  @before([hasPermission('dashboard')])
  public async getDayOfWeek(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getDayOfWeek(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/monthly-trend')
  @GET()
  @before([hasPermission('dashboard')])
  public async getMonthlyTrend(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getMonthlyTrend(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/top-clients')
  @GET()
  @before([hasPermission('dashboard')])
  public async getTopClients(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const limit = parseInt(req.query.limit as string) || 5;
      const data = await this.analyticsService.getTopClients(from, to, limit);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/daily-comparison')
  @GET()
  @before([hasPermission('dashboard')])
  public async getDailyComparison(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getDailyComparison(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/hourly')
  @GET()
  @before([hasPermission('dashboard')])
  public async getHourly(req: AuthRequest, res: Response) {
    try {
      const { from, to } = parsePeriod(req);
      const data = await this.analyticsService.getHourlyDistribution(from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}
