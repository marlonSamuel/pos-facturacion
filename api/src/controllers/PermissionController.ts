import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';
import { BaseController } from '../common/base/base.controller';
import { Permiso } from '../models';
@route('/permissions')
export class PermissionController extends BaseController {
  @GET()
  public async getAll(_req: Request, res: Response) {
    try {
      const data = await Permiso.findAll({ attributes: ['idpermiso', 'nombre'] });
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}
