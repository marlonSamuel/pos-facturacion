import type { Request, Response, NextFunction } from 'express';
import { hasPermission, requireSucursal, AuthRequest } from '../../src/common/middleware/auth.middleware';

function mockReq(auth?: any): Partial<AuthRequest> {
  return { auth } as any;
}

function mockRes(): Partial<Response> {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ============================================================
// hasPermission
// ============================================================
describe('hasPermission middleware', () => {
  it('debe retornar 401 si no hay auth', () => {
    const req = mockReq(undefined);
    const res = mockRes();
    const next = jest.fn();

    hasPermission('ventas')(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'No autenticado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe dar acceso total si idrol=1 (admin)', () => {
    const req = mockReq({ id: 1, idrol: 1, permissions: [], rolePermissions: [] });
    const res = mockRes();
    const next = jest.fn();

    hasPermission('cualquier-permiso')(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe pasar si el usuario tiene el permiso via rolePermissions', () => {
    const req = mockReq({
      id: 2, idrol: 2,
      permissions: [],
      rolePermissions: ['ventas', 'dashboard'],
    });
    const res = mockRes();
    const next = jest.fn();

    hasPermission('ventas')(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it('debe pasar si el usuario tiene el permiso via permissions legacy', () => {
    const req = mockReq({
      id: 2, idrol: 2,
      permissions: ['ventas'],
      rolePermissions: [],
    });
    const res = mockRes();
    const next = jest.fn();

    hasPermission('ventas')(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it('debe retornar 403 si no tiene el permiso', () => {
    const req = mockReq({
      id: 2, idrol: 2,
      permissions: [],
      rolePermissions: ['dashboard'],
    });
    const res = mockRes();
    const next = jest.fn();

    hasPermission('ventas')(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: 'No tiene permisos para acceder a este módulo: ventas',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe unir rolePermissions + permissions para la verificación', () => {
    const req = mockReq({
      id: 2, idrol: 2,
      permissions: ['compras'],
      rolePermissions: ['ventas'],
    });
    const res = mockRes();
    const next = jest.fn();

    // Debería tener acceso porque permissions incluye 'compras'
    hasPermission('compras')(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });
});

// ============================================================
// requireSucursal
// ============================================================
describe('requireSucursal middleware', () => {
  it('debe retornar 400 si no hay idsucursal', () => {
    const req = mockReq({ id: 1, idsucursal: null, sucursales: [], idrol: 2 });
    const res = mockRes();
    const next = jest.fn();

    requireSucursal(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Sucursal no seleccionada' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe pasar si es admin (idrol=1) aunque no esté en sucursales', () => {
    const req = mockReq({ id: 1, idsucursal: 5, sucursales: [1], idrol: 1 });
    const res = mockRes();
    const next = jest.fn();

    requireSucursal(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it('debe pasar si el usuario tiene acceso a la sucursal', () => {
    const req = mockReq({ id: 2, idsucursal: 2, sucursales: [1, 2, 3], idrol: 2 });
    const res = mockRes();
    const next = jest.fn();

    requireSucursal(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it('debe retornar 403 si el usuario no tiene acceso a la sucursal', () => {
    const req = mockReq({ id: 2, idsucursal: 5, sucursales: [1, 2], idrol: 2 });
    const res = mockRes();
    const next = jest.fn();

    requireSucursal(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Sin acceso a esta sucursal' });
    expect(next).not.toHaveBeenCalled();
  });
});
