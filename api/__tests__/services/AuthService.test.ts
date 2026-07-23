/**
 * AuthService — Test Suite
 * Mock de modelos Usuario, Permiso, UsuarioPermiso + bcrypt + jwt
 */

jest.mock('../../src/models', () => ({
  Usuario: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  Permiso: {},
  UsuarioPermiso: {},
  UsuarioSucursal: {
    findAll: jest.fn(),
  },
  Sucursal: {
    findOne: jest.fn(),
  },
  Comercio: {
    findOne: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hashSync: jest.fn(() => '$2a$10$hashed'),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(),
}));

import { Usuario } from '../../src/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/services/AuthService';

const mockUsuario = Usuario as jest.Mocked<typeof Usuario>;
let service: AuthService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new AuthService();
  process.env.JWT_SECRET_KEY = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  // Mock privados
  jest.spyOn(AuthService.prototype as any, 'getRolePermissions').mockResolvedValue([]);
  jest.spyOn(AuthService.prototype as any, 'getUserSucursales').mockResolvedValue([1]);
});

const mockUserData = {
  idusuario: 1,
  nombre: 'Admin',
  tipo_documento: 'DPI',
  num_documento: '123456789',
  direccion: 'Ciudad',
  telefono: '5555-5555',
  email: 'admin@test.com',
  login: 'admin',
  imagen: 'admin.jpg',
  condicion: 1,
  clave: '$2a$10$existinghash',
  idcomercio: 1,
  idsucursal: 1,
};

// ============================================================
// login
// ============================================================
describe('login', () => {
  it('debe retornar token + usuario con permisos cuando credenciales son válidas', async () => {
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ get: () => mockUserData });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock-token');

    jest.spyOn(AuthService.prototype as any, 'getRolePermissions')
      .mockResolvedValue(['ventas', 'compras']);

    const result = await service.login({ username: 'admin', password: '123' });

    expect(result.ok).toBe(true);
    expect(result.token).toBe('mock-token');
    expect(result.refreshToken).toBe('mock-token');
    expect(result.user!.nombre).toBe('Admin');
    expect(result.user!.permisos).toEqual(['ventas', 'compras']);
    expect(mockUsuario.findOne).toHaveBeenCalledWith({
      where: { login: 'admin', condicion: 1 }
    });
  });

  it('debe lanzar 401 si el usuario no existe', async () => {
    (mockUsuario.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.login({ username: 'noexiste', password: '123' }))
      .rejects.toThrow('Usuario o contraseña incorrectos');
  });

  it('debe lanzar 401 si la contraseña es incorrecta', async () => {
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ get: () => mockUserData });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login({ username: 'admin', password: 'wrong' }))
      .rejects.toThrow('Usuario o contraseña incorrectos');
  });

  it('debe migrar SHA256 legacy a bcrypt si detecta hash antiguo', async () => {
    // SHA256('123') en hex
    const legacyHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    const legacyUser = { ...mockUserData, clave: legacyHash };
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ get: () => legacyUser });
    // Simular que bcrypt lanza (el hash no es formato bcrypt) → falla a SHA256
    (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Not bcrypt'));
    jest.spyOn(AuthService.prototype as any, 'getRolePermissions')
      .mockResolvedValue([]);

    await service.login({ username: 'admin', password: '123' });

    expect(mockUsuario.update).toHaveBeenCalledWith(
      { clave: '$2a$10$hashed' },
      { where: { idusuario: 1 } }
    );
  });
});

// ============================================================
// refreshAccessToken
// ============================================================
describe('refreshAccessToken', () => {
  it('debe emitir nuevo access token si refresh es válido', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      isRefresh: true,
      id: 1,
      username: 'admin',
      cargo: 'admin',
      permissions: ['ventas'],
    });
    (jwt.sign as jest.Mock).mockReturnValue('new-access-token');
    (mockUsuario.findByPk as jest.Mock).mockResolvedValue({ get: () => mockUserData });

    const result = await service.refreshAccessToken('valid-refresh-token');
    expect(result.ok).toBe(true);
    expect(result.token).toBe('new-access-token');
  });

  it('debe lanzar 401 si refresh token es inválido', async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('jwt expired'); });
    await expect(service.refreshAccessToken('bad-token'))
      .rejects.toThrow('Refresh token inválido o expirado');
  });

  it('debe lanzar 401 si el token no es de tipo refresh', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ isRefresh: false });
    await expect(service.refreshAccessToken('no-refresh-token'))
      .rejects.toThrow('Token no válido para renovación');
  });
});

// ============================================================
// Multi-Comercio
// ============================================================
describe('multi-comercio', () => {
  it('debe retornar idcomercio, idsucursal y sucursales en login', async () => {
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ get: () => mockUserData });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock-token');
    jest.spyOn(AuthService.prototype as any, 'getRolePermissions').mockResolvedValue(['ventas']);

    const result = await service.login({ username: 'admin', password: '123' });

    expect(result.user!.idcomercio).toBe(1);
    expect(result.user!.idsucursal).toBe(1);
    expect(result.user!.sucursales).toEqual([1]);
  });

  it('cambiarSucursal debe emitir nuevo token con idsucursal actualizado', async () => {
    (mockUsuario.findByPk as jest.Mock).mockResolvedValue({ get: () => mockUserData });
    jest.spyOn(AuthService.prototype as any, 'getUserSucursales').mockResolvedValue([1, 2]);
    (jwt.sign as jest.Mock).mockReturnValue('nuevo-token');

    const result = await service.cambiarSucursal(1, 2);

    expect(result.token).toBe('nuevo-token');
    expect(result.idsucursal).toBe(2);
  });

  it('cambiarSucursal debe lanzar 403 si no tiene acceso a la sucursal', async () => {
    (mockUsuario.findByPk as jest.Mock).mockResolvedValue({ get: () => ({ ...mockUserData, idrol: 2 }) });
    jest.spyOn(AuthService.prototype as any, 'getUserSucursales').mockResolvedValue([1]);

    await expect(service.cambiarSucursal(1, 99))
      .rejects.toThrow('No tiene acceso a esta sucursal');
  });

  it('getComercioInfo debe retornar null si el slug no existe', async () => {
    const { Comercio } = require('../../src/models');
    (Comercio.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.getComercioInfo('slug-inexistente');
    expect(result).toBeNull();
  });
});
