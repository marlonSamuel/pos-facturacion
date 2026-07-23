import { GET, POST, PUT, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { check, param, body } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { ApplicationException } from '../common/errors/application.exception';
import { UserService } from '../services/UserService';
import { AuditService } from '../services/AuditService';
import { validateFields } from '../common/middleware/validate-fields';
import { hasPermission, AuthRequest } from '../common/middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
// Configuración de multer para imágenes de usuarios
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads/users'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${uuid()}${ext}`);
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
@route('/users')
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }
  @GET()
  @before([hasPermission('usuarios')])
  public async getAll(_req: Request, res: Response) {
    try {
      const data = await this.userService.getAll();
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @GET()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.userService.getById(id);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id/permissions')
  @GET()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async getPermissions(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data = await this.userService.getPermissionsByUser(id);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @POST()
  @before([
    hasPermission('usuarios'),
    upload.single('imagen'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    check('tipo_documento').notEmpty().withMessage('El tipo de documento es requerido')
      .isIn(['DPI', 'NIT', 'CF']).withMessage('Tipo documento inválido'),
    check('num_documento').notEmpty().withMessage('El número de documento es requerido')
      .isLength({ max: 20 }).withMessage('No. documento no puede exceder 20 caracteres'),
    check('login').notEmpty().withMessage('El login es requerido')
      .isLength({ max: 20 }).withMessage('El login no puede exceder 20 caracteres'),
    check('clave').notEmpty().withMessage('La contraseña es requerida')
      .isLength({ min: 4, max: 64 }).withMessage('La contraseña debe tener entre 4 y 64 caracteres'),
    check('direccion').optional({ values: 'falsy' })
      .isLength({ max: 70 }).withMessage('Dirección no puede exceder 70 caracteres'),
    check('telefono').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('Teléfono no puede exceder 20 caracteres'),
    check('email').optional({ values: 'falsy' })
      .isEmail().withMessage('Correo electrónico inválido')
      .isLength({ max: 50 }).withMessage('Email no puede exceder 50 caracteres'),
    check('idrol').optional({ values: 'falsy' }).isInt().withMessage('Rol inválido'),
    validateFields
  ])
  public async create(req: AuthRequest, res: Response) {
    try {
      const imagen = req.file?.filename;
      const data = { ...req.body, imagen };
      if (data.permisos && Array.isArray(data.permisos)) delete data.permisos;
      // Parsear sucursales desde FormData (string | string[])
      if (data.sucursales) {
        data.sucursales = Array.isArray(data.sucursales)
          ? data.sucursales.map(Number)
          : [Number(data.sucursales)];
      }
      if (!data.sucursales || data.sucursales.length === 0) {
        throw new ApplicationException('Debe asignar al menos una sucursal');
      }
      const result = await this.userService.create(data);
      AuditService.registrar(req.auth?.username ?? null, 'CREAR', 'usuario', (result as any)?.idusuario, JSON.stringify({ login: data.login, nombre: data.nombre, idrol: data.idrol }), req.ip);
      res.status(201).send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id')
  @PUT()
  @before([
    hasPermission('usuarios'),
    upload.single('imagen'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    check('tipo_documento').notEmpty().withMessage('El tipo de documento es requerido')
      .isIn(['DPI', 'NIT', 'CF']).withMessage('Tipo documento inválido'),
    check('num_documento').notEmpty().withMessage('El número de documento es requerido')
      .isLength({ max: 20 }).withMessage('No. documento no puede exceder 20 caracteres'),
    check('login').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('El login no puede exceder 20 caracteres'),
    check('clave').optional({ values: 'falsy' })
      .isLength({ min: 4, max: 64 }).withMessage('La contraseña debe tener entre 4 y 64 caracteres'),
    check('direccion').optional({ values: 'falsy' })
      .isLength({ max: 70 }).withMessage('Dirección no puede exceder 70 caracteres'),
    check('telefono').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('Teléfono no puede exceder 20 caracteres'),
    check('email').optional({ values: 'falsy' })
      .isEmail().withMessage('Correo electrónico inválido')
      .isLength({ max: 50 }).withMessage('Email no puede exceder 50 caracteres'),
    check('idrol').optional({ values: 'falsy' }).isInt().withMessage('Rol inválido'),
    validateFields
  ])
  public async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const imagen = req.file?.filename;
      const data = { ...req.body, imagen };
      if (data.permisos && Array.isArray(data.permisos)) delete data.permisos;
      // Parsear sucursales desde FormData (string | string[])
      if (data.sucursales) {
        data.sucursales = Array.isArray(data.sucursales)
          ? data.sucursales.map(Number)
          : [Number(data.sucursales)];
      }
      const result = await this.userService.update(id, data);
      AuditService.registrar(req.auth?.username ?? null, 'EDITAR', 'usuario', id, JSON.stringify({ login: data.login, nombre: data.nombre }), req.ip);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/:id/toggle-status')
  @PUT()
  @before([
    hasPermission('usuarios'),
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async toggleStatus(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const requestedBy = req.auth?.id as number;
      const result = await this.userService.toggleStatus(id, requestedBy);
      AuditService.registrar(req.auth?.username ?? null, result.condicion === 1 ? 'ACTIVAR' : 'DESACTIVAR', 'usuario', id, undefined, req.ip);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}
@route('/users/change-password')
export class UserChangePasswordController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }
  @PUT()
  @before([
    check('idusuario').isInt().withMessage('ID de usuario inválido'),
    check('clave_actual').notEmpty().withMessage('La contraseña actual es requerida'),
    check('clave_nueva').notEmpty().withMessage('La nueva contraseña es requerida')
      .isLength({ min: 4, max: 64 }).withMessage('La nueva contraseña debe tener entre 4 y 64 caracteres'),
    validateFields
  ])
  public async changePassword(req: Request, res: Response) {
    try {
      const { idusuario, clave_actual, clave_nueva } = req.body;
      const result = await this.userService.changePassword(idusuario, clave_actual, clave_nueva);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}
@route('/profile')
export class ProfileController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }
  @GET()
  public async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.id;
      if (!userId) return res.status(401).send({ ok: false, message: 'No autenticado' });
      const data = await this.userService.getById(userId);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @PUT()
  @before([
    upload.single('imagen'),
    check('nombre').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    check('tipo_documento').notEmpty().withMessage('El tipo de documento es requerido')
      .isIn(['DPI', 'NIT', 'CF']).withMessage('Tipo documento inválido'),
    check('num_documento').notEmpty().withMessage('El número de documento es requerido')
      .isLength({ max: 20 }).withMessage('No. documento no puede exceder 20 caracteres'),
    check('cargo').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('El cargo no puede exceder 20 caracteres'),
    check('direccion').optional({ values: 'falsy' })
      .isLength({ max: 70 }).withMessage('Dirección no puede exceder 70 caracteres'),
    check('telefono').optional({ values: 'falsy' })
      .isLength({ max: 20 }).withMessage('Teléfono no puede exceder 20 caracteres'),
    validateFields
  ])
  public async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.id;
      if (!userId) return res.status(401).send({ ok: false, message: 'No autenticado' });
      const imagen = req.file?.filename;
      const data = await this.userService.updateProfile(userId, req.body, imagen);
      res.send(data);
    } catch (error) {
      this.handleException(error, res);
    }
  }
  @route('/change-password')
  @PUT()
  @before([
    check('clave_actual').notEmpty().withMessage('La contraseña actual es requerida'),
    check('clave_nueva').notEmpty().withMessage('La nueva contraseña es requerida')
      .isLength({ min: 4, max: 64 }).withMessage('La nueva contraseña debe tener entre 4 y 64 caracteres'),
    validateFields
  ])
  public async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.id;
      if (!userId) return res.status(401).send({ ok: false, message: 'No autenticado' });
      const { clave_actual, clave_nueva } = req.body;
      const result = await this.userService.changePassword(userId, clave_actual, clave_nueva);
      res.send(result);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

