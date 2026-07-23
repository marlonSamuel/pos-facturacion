import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
  auth?: {
    id: number;
    username: string;
    idrol: number | null;
    idcomercio: number | null;
    idsucursal: number | null;
    sucursales: number[];
    permissions: string[];
    rolePermissions?: string[];
  };
  comercio?: { idcomercio: number; nickname: string };
}
/**
 * Middleware para verificar permisos específicos por módulo.
 * Evalúa permisos del rol + permisos individuales del usuario.
 * Uso: @before([hasPermission('ventas')])
 */
export const hasPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) {
      return res.status(401).json({ ok: false, message: 'No autenticado' });
    }
    // Admin (idrol=1) tiene acceso a todo
    if (auth.idrol === 1) {
      return next();
    }
    // Unir permisos del rol (rolePermissions) + legacy individuales (permissions, hoy vacío)
    const allPermissions = [...(auth.rolePermissions || []), ...(auth.permissions || [])];
    if (allPermissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({
      ok: false,
      message: `No tiene permisos para acceder a este módulo: ${permission}`
    });
  };
};
/**
 * Middleware para verificar que el usuario tiene una sucursal activa seleccionada
 */
export const requireSucursal = (req: AuthRequest, res: Response, next: NextFunction) => {
  const auth = req.auth;
  if (!auth?.idsucursal) {
    return res.status(400).json({ ok: false, message: 'Sucursal no seleccionada' });
  }
  // Admin (idrol=1) puede acceder a cualquier sucursal
  if (auth.idrol === 1) return next();
  // Verificar que el usuario tiene acceso a esta sucursal
  if (!auth.sucursales?.includes(auth.idsucursal)) {
    return res.status(403).json({ ok: false, message: 'Sin acceso a esta sucursal' });
  }
  next();
};
