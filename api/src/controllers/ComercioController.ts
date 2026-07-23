import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';
import { BaseController } from '../common/base/base.controller';
import { AuthService } from '../services/AuthService';
@route('/comercio')
export class ComercioController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }
  @route('/info/:slug')
  @GET()
  public async getInfo(req: Request, res: Response) {
    try {
      const slug = req.params.slug as string;
      const info = await this.authService.getComercioInfo(slug);
      if (!info) {
        return res.status(404).send({ ok: false, message: 'Comercio no encontrado' });
      }
      res.send(info);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}
