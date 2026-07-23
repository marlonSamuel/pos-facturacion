import { GET, POST, PUT, DELETE, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check, param } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { ComercioService } from '../services/ComercioService';
import { AuthService } from '../services/AuthService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, AuthRequest } from '../common/middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads/comercios'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uuid()}${ext}`);
  }
});
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});
@route('/comercios')
export class ComercioCrudController extends BaseController {
  constructor(
    private readonly comercioService: ComercioService,
    private readonly authService: AuthService
  ) {
    super();
  }
  @GET()
  @before([hasPermission('usuarios')])
  public async getAll(_req: Request, res: Response) {
    try {
      const data = await this.comercioService.getAll();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @GET()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('ID inválido'),
    validateFields
  ])
  public async getById(req: Request, res: Response) {
    try {
      const data = await this.comercioService.getById(parseInt(req.params.id as string));
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('usuarios'),
    check('nombre').notEmpty().withMessage('Nombre requerido'),
    check('nickname').notEmpty().withMessage('Nickname requerido'),
    validateFields
  ])
  public async create(req: AuthRequest, res: Response) {
    try {
      const data = await this.comercioService.create(req.body);
      res.status(201).send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  /** PUT /comercios/me â Admin actualiza su propio comercio (logo, dirección, teléfono) */
  @route('/me')
  @PUT()
  @before([
    hasPermission('usuarios'),
    upload.single('logo'),
    check('nombre').optional().isLength({ max: 100 }),
    check('direccion').optional().isLength({ max: 150 }),
    check('telefono').optional().isLength({ max: 20 }),
    validateFields
  ])
  public async updateMe(req: AuthRequest, res: Response) {
    try {
      const auth = req.auth;
      if (!auth?.idcomercio) {
        return res.status(400).json({ ok: false, message: 'Comercio no identificado' });
      }
      const data: any = { ...req.body };
      if (req.file?.filename) data.logo = req.file.filename;
      const result = await this.comercioService.update(auth.idcomercio, data);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @PUT()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('ID inválido'),
    validateFields
  ])
  public async update(req: Request, res: Response) {
    try {
      const data = await this.comercioService.update(parseInt(req.params.id as string), req.body);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @DELETE()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('ID inválido'),
    validateFields
  ])
  public async delete(req: Request, res: Response) {
    try {
      const data = await this.comercioService.delete(parseInt(req.params.id as string));
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

