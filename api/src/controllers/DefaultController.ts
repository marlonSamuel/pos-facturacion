import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';
@route('/check')
export class DefaultController {
  @GET()
  public index(_req: Request, res: Response): void {
    res.send({
      ok: true,
      message: '🚀 API New Horizon corriendo correctamente',
      timestamp: new Date().toISOString()
    });
  }
}
