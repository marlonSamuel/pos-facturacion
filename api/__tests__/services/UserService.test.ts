/**
 * UserService — Test Suite
 */

jest.mock('../../src/models', () => ({
  Usuario: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  UsuarioPermiso: {},
  Permiso: {},
  Rol: {},
  RolPermiso: {
    findAll: jest.fn(),
  },
  UsuarioSucursal: {
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  Sucursal: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../src/common/database/mysql', () => ({
  sequelize: {
    transaction: jest.fn(),
    literal: jest.fn((val: string) => val),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hashSync: jest.fn(() => '$2a$10$hashedpassword'),
}));

jest.mock('fs');
jest.mock('path');

jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: () => ({}),
  getSucursalId: () => 1,
  getComercioId: () => 1,
}));

import { Usuario, UsuarioPermiso, Rol, Sucursal, UsuarioSucursal } from '../../src/models';
import { sequelize } from '../../src/common/database/mysql';
import { UserService } from '../../src/services/UserService';
import bcrypt from 'bcryptjs';

const mockUsuario = Usuario as jest.Mocked<typeof Usuario>;
const mockUsuarioPermiso = UsuarioPermiso as jest.Mocked<typeof UsuarioPermiso>;
const mockUsuarioSucursal = UsuarioSucursal as jest.Mocked<typeof UsuarioSucursal>;
let service: UserService;

const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  service = new UserService();
  (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  // Mock findAll de UsuarioSucursal para que retorne array vacío por defecto
  (mockUsuarioSucursal.findAll as jest.Mock).mockResolvedValue([]);
  // Mock Sucursal.findAll para create
  const { Sucursal } = require('../../src/models');
  (Sucursal.findAll as jest.Mock).mockResolvedValue([]);
});

const mockUserRow = {
  idusuario: 1,
  nombre: 'Admin',
  login: 'admin',
  cargo: 'admin',
  condicion: 1,
  imagen: 'user.jpg',
  tipo_documento: 'DPI',
  num_documento: '123',
  direccion: 'Calle',
  telefono: '555',
  email: 'a@a.com',
  idrol: 1,
  rol: { nombre: 'Admin', idrol: 1 },
  get: function () { return this; },
};

const mockUserRowWithoutRol = {
  ...mockUserRow,
  idrol: null,
  rol: null,
  get: function () { return this; },
};

// ============================================================
// getAll
// ============================================================
describe('getAll', () => {
  it('debe retornar todos los usuarios con permisos', async () => {
    (mockUsuario.findAll as jest.Mock).mockResolvedValue([mockUserRow, mockUserRowWithoutRol]);
    const result = await service.getAll();
    expect(result).toHaveLength(2);
    expect(mockUsuario.findAll).toHaveBeenCalledWith({
      where: { idcomercio: 1 },
      include: [
        { model: Rol, as: 'rol', attributes: ['nombre', 'idrol'] },
      ],
    });
  });
});

// ============================================================
// getById
// ============================================================
describe('getById', () => {
  it('debe retornar usuario por ID', async () => {
    (mockUsuario.findOne as jest.Mock).mockResolvedValue(mockUserRow);
    const result = await service.getById(1);
    expect((result as any).idusuario).toBe(1);
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockUsuario.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow('Usuario no encontrado');
  });
});

// ============================================================
// create
// ============================================================
describe('create', () => {
  const newUserData = {
    nombre: 'Nuevo',
    login: 'nuevo',
    clave: '123',
    permisos: [1, 2],
  };

  it('debe crear usuario con permisos', async () => {
    (mockUsuario.findOne as jest.Mock).mockResolvedValueOnce(null); // login no existe
    (mockUsuario.create as jest.Mock).mockResolvedValue({ idusuario: 2, get: () => ({ idusuario: 2 }) });
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ idusuario: 2, get: () => ({ idusuario: 2, nombre: 'Nuevo', login: 'nuevo', idrol: 1, rol: { nombre: 'Admin' } }) });

    const result = await service.create(newUserData as any);
    expect(result).toBeDefined();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('debe rechazar si el login ya existe', async () => {
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ idusuario: 99 } as any);
    await expect(service.create(newUserData as any)).rejects.toThrow('El nombre de usuario ya está en uso');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('debe usar contraseña por defecto si no se provee', async () => {
    const dataSinClave = { nombre: 'Test', login: 'test', permisos: [] };
    (mockUsuario.findOne as jest.Mock).mockResolvedValueOnce(null);
    (mockUsuario.create as jest.Mock).mockResolvedValue({ idusuario: 3, get: () => ({ idusuario: 3 }) });
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ idusuario: 3, get: () => ({ idusuario: 3, nombre: 'Test', login: 'test', idrol: null, rol: null }) });
    await service.create(dataSinClave as any);
    const createCall = (mockUsuario.create as jest.Mock).mock.calls[0][0];
    expect(createCall.clave).toBe('$2a$10$hashedpassword');
  });

  it('debe crear usuario con sucursales especificas', async () => {
    const dataConSucursales = { ...newUserData, sucursales: [1, 2] };
    (mockUsuario.findOne as jest.Mock).mockResolvedValueOnce(null);
    (mockUsuario.create as jest.Mock).mockResolvedValue({ idusuario: 4, get: () => ({ idusuario: 4 }) });
    (mockUsuarioSucursal.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ idusuario: 4, get: () => ({ idusuario: 4, nombre: 'Test', login: 'test', idrol: null, rol: null }) });
    await service.create(dataConSucursales as any);
    // Debe crear usuario_sucursal para cada sucursal
    expect(mockUsuarioSucursal.findOrCreate).toHaveBeenCalledTimes(2);
    expect(mockUsuarioSucursal.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idusuario: 4, idsucursal: 1 } })
    );
  });
});

// ============================================================
// update (with sucursales)
// ============================================================
describe('update', () => {
  it('debe actualizar usuario y sincronizar sucursales', async () => {
    const mockRow = { get: () => ({ imagen: 'old.jpg' }) };
    (mockUsuario.findByPk as jest.Mock).mockResolvedValue(mockRow);
    (mockUsuarioSucursal.destroy as jest.Mock).mockResolvedValue(undefined);
    (mockUsuarioSucursal.create as jest.Mock).mockResolvedValue({});
    (mockUsuarioSucursal.findAll as jest.Mock).mockResolvedValue([]); // para getById -> getUserSucursalesIds
    (mockUsuario.findOne as jest.Mock).mockResolvedValue({ idusuario: 1, get: () => ({ idusuario: 1, nombre: 'Actualizado', login: 'test', idrol: null, rol: null }) });

    const data = { nombre: 'Actualizado', sucursales: [2, 3] };
    await service.update(1, data as any);
    // Debe eliminar asignaciones anteriores y crear las nuevas
    expect(mockUsuarioSucursal.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idusuario: 1 } })
    );
    expect(mockUsuarioSucursal.create).toHaveBeenCalledTimes(2);
    expect(mockTransaction.commit).toHaveBeenCalled();
  });
});

// ============================================================
// changePassword
// ============================================================
describe('changePassword', () => {
  it('debe cambiar contraseña', async () => {
    (mockUsuario.findByPk as jest.Mock).mockResolvedValue({ idusuario: 1, get: () => ({ idusuario: 1, clave: 'hash' }) } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const result = await service.changePassword(1, 'old', 'new');
    expect(result).toEqual({ ok: true });
    expect(mockUsuario.update).toHaveBeenCalled();
  });
});

// ============================================================
// toggleStatus
// ============================================================
describe('toggleStatus', () => {
  it('debe cambiar estado del usuario', async () => {
    (mockUsuario.findByPk as jest.Mock).mockResolvedValue({ idusuario: 2, condicion: 1 } as any);
    const result = await service.toggleStatus(2, 1);
    expect(result).toEqual({ ok: true, condicion: 0 });
  });

  it('debe evitar auto-desactivación', async () => {
    await expect(service.toggleStatus(1, 1)).rejects.toThrow('No puedes desactivarte a ti mismo');
  });
});
