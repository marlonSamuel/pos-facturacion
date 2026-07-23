/**
 * PersonService — Test Suite
 */

jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: () => ({}),
  getSucursalId: () => 1,
  comercioFilter: () => ({}),
  getComercioId: () => 1,
}));

jest.mock('../../src/models', () => ({
  Person: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

import { Person } from '../../src/models';
import { PersonService } from '../../src/services/PersonService';

const mockPerson = Person as jest.Mocked<typeof Person>;
let service: PersonService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new PersonService();
});

// ============================================================
// getAll
// ============================================================
describe('getAll', () => {
  it('debe retornar solo clientes', async () => {
    const clients = [{ idpersona: 1, nombre: 'Cliente A', tipo_persona: 'Cliente' }];
    (mockPerson.findAll as jest.Mock).mockResolvedValue(clients);
    const result = await service.getAll('Cliente');
    expect(result).toEqual(clients);
    expect(mockPerson.findAll).toHaveBeenCalledWith({ where: { tipo_persona: 'Cliente' } });
  });

  it('debe retornar solo proveedores', async () => {
    const providers = [{ idpersona: 2, nombre: 'Proveedor A', tipo_persona: 'Proveedor' }];
    (mockPerson.findAll as jest.Mock).mockResolvedValue(providers);
    const result = await service.getAll('Proveedor');
    expect(result).toEqual(providers);
    expect(mockPerson.findAll).toHaveBeenCalledWith({ where: { tipo_persona: 'Proveedor' } });
  });

  it('debe retornar array vacío si no hay registros', async () => {
    (mockPerson.findAll as jest.Mock).mockResolvedValue([]);
    const result = await service.getAll('Cliente');
    expect(result).toEqual([]);
  });
});

// ============================================================
// getById
// ============================================================
describe('getById', () => {
  it('debe retornar persona por ID', async () => {
    const person = { idpersona: 1, nombre: 'Juan' };
    (mockPerson.findOne as jest.Mock).mockResolvedValue(person);
    const result = await service.getById(1);
    expect(result).toEqual(person);
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockPerson.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow('Persona no encontrada');
  });
});

// ============================================================
// create
// ============================================================
describe('create', () => {
  it('debe crear una persona', async () => {
    const data = { nombre: 'Nuevo', tipo_persona: 'Cliente' };
    (mockPerson.create as jest.Mock).mockResolvedValue({ idpersona: 1, ...data });
    const result = await service.create(data as any);
    expect(result).toEqual({ idpersona: 1, ...data });
    expect(mockPerson.create).toHaveBeenCalledWith({ idcomercio: 1, ...data });
  });
});

// ============================================================
// update
// ============================================================
describe('update', () => {
  const mockRow = { idpersona: 1, nombre: 'Antes', update: jest.fn() };

  it('debe actualizar persona existente', async () => {
    (mockPerson.findOne as jest.Mock).mockResolvedValue(mockRow);
    await service.update(1, { nombre: 'Después' } as any);
    expect(mockRow.update).toHaveBeenCalledWith({ nombre: 'Después' });
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockPerson.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.update(999, {} as any)).rejects.toThrow('Persona no encontrada');
  });
});

// ============================================================
// delete
// ============================================================
describe('delete', () => {
  const mockRow = { idpersona: 1, destroy: jest.fn().mockResolvedValue(undefined) };

  it('debe eliminar persona existente', async () => {
    (mockPerson.findOne as jest.Mock).mockResolvedValue(mockRow);
    const result = await service.delete(1);
    expect(result).toEqual({ ok: true });
    expect(mockRow.destroy).toHaveBeenCalled();
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockPerson.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.delete(999)).rejects.toThrow('Persona no encontrada');
  });
});
