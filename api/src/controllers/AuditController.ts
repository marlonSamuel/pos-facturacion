import { GET, route, before } from 'awilix-express';
import { Response } from 'express';
import { BaseController } from '../common/base/base.controller';
import { AuditService } from '../services/AuditService';
import { AuthRequest, hasPermission } from '../common/middleware/auth.middleware';
@route('/audit')
export class AuditController extends BaseController {
  constructor(private readonly auditService: AuditService) {
    super();
  }
  @route('/logs')
  @GET()
  @before([hasPermission('usuarios')])
  public async getLogs(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const tabla = req.query.tabla as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const data = await this.auditService.getAll(page, pageSize, tabla, from, to);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/tables')
  @GET()
  @before([hasPermission('usuarios')])
  public async getTables(req: AuthRequest, res: Response) {
    try {
      const tables = await this.auditService.getTables();
      res.send(tables);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}
