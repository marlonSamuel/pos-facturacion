import { Response } from 'express';
import { ApplicationException } from '../errors/application.exception';
export abstract class BaseController {
  handleException(err: any, res: Response) {
    if (err instanceof ApplicationException) {
      res.status(err.statusCode).send({ ok: false, message: err.message });
    } else {
      console.error('Error inesperado:', err.message);
      res.status(500).send({ ok: false, message: 'Error inesperado del servidor' });
    }
  }
}
