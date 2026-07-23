/**
 * CategoryService — Test Suite
 * Mock de modelos Sequelize: Categoria, Articulo
 */

jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: () => ({}),
  getSucursalId: () => 1,
  comercioFilter: () => ({}),
  getComercioId: () => 1,
}));

jest.mock('../../src/models', () => ({
  Categoria: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Articulo: {
    count: jest.fn(),
  },
}));

import { Categoria, Articulo } from '../../src/models';
import { CategoryService } from '../../src/services/CategoryService';

const mockCategoria = Categoria as jest.Mocked<typeof Categoria>;
const mockArticulo = Articulo as jest.Mocked<typeof Articulo>;
let service: CategoryService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new CategoryService();
});

// Helper data-driven
function runCases<T>(cases: { name: string; mocks: (() => void)[]; params: any[]; expected: T }[], fn: (...args: any[]) => Promise<T>) {
  cases.forEach(({ name, mocks, params, expected }) => {
    it(name, async () => {
      jest.clearAllMocks();
      mocks.forEach(m => m());
      const result = await fn(...params);
      expect(result).toEqual(expected);
    });
  });
}

// ============================================================
// getAll
// ============================================================
describe('getAll', () => {
  runCases([
    {
      name: 'debe retornar categorías activas',
      mocks: [() => (mockCategoria.findAll as jest.Mock).mockResolvedValue([{ idcategoria: 1, nombre: 'Cat1', condicion: 1 } as any])],
      params: [],
      expected: [{ idcategoria: 1, nombre: 'Cat1', condicion: 1 } as any],
    },
    {
      name: 'debe retornar array vacío si no hay categorías',
      mocks: [() => (mockCategoria.findAll as jest.Mock).mockResolvedValue([])],
      params: [],
      expected: [],
    },
  ], () => service.getAll());
});

// ============================================================
// getById
// ============================================================
describe('getById', () => {
  runCases([
    {
      name: 'debe retornar categoría por ID',
      mocks: [() => (mockCategoria.findOne as jest.Mock).mockResolvedValue({ idcategoria: 1, nombre: 'Cat1' } as any)],
      params: [1],
      expected: { idcategoria: 1, nombre: 'Cat1' } as any,
    },
    {
      name: 'debe lanzar 404 si no existe',
      mocks: [() => (mockCategoria.findOne as jest.Mock).mockResolvedValue(null)],
      params: [999],
      expected: new Error('Categoría no encontrada'),
    },
  ], (id: number) => service.getById(id).catch(e => e));
});

// Override runCases for error tests - check message
describe('getById errors', () => {
  it('debe lanzar ApplicationException con 404 si no existe', async () => {
    (mockCategoria.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow('Categoría no encontrada');
  });
});

// ============================================================
// create
// ============================================================
describe('create', () => {
  it('debe crear una categoría', async () => {
    const data = { nombre: 'Nueva Cat', descripcion: 'Test' };
    (mockCategoria.create as jest.Mock).mockResolvedValue({ idcategoria: 1, ...data } as any);
    const result = await service.create(data as any);
    expect((result as any).idcategoria).toBe(1);
    expect(mockCategoria.create).toHaveBeenCalledWith({ idcomercio: 1, ...data });
  });
});

// ============================================================
// update
// ============================================================
describe('update', () => {
  const mockRow = { idcategoria: 1, nombre: 'Antes', update: jest.fn() };

  it('debe actualizar una categoría existente', async () => {
    (mockCategoria.findOne as jest.Mock).mockResolvedValue(mockRow);
    mockRow.update.mockResolvedValue({ idcategoria: 1, nombre: 'Después' });
    const result = await service.update(1, { nombre: 'Después' } as any);
    expect(mockRow.update).toHaveBeenCalledWith({ nombre: 'Después' });
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockCategoria.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.update(999, {} as any)).rejects.toThrow('Categoría no encontrada');
  });
});

// ============================================================
// delete
// ============================================================
describe('delete', () => {
  const mockRow = { idcategoria: 1, destroy: jest.fn().mockResolvedValue(undefined) };

  it('debe eliminar si no tiene artículos asociados', async () => {
    (mockCategoria.findOne as jest.Mock).mockResolvedValue(mockRow);
    (mockArticulo.count as jest.Mock).mockResolvedValue(0);
    const result = await service.delete(1);
    expect(result).toEqual({ ok: true });
    expect(mockRow.destroy).toHaveBeenCalled();
  });

  it('debe rechazar eliminación si tiene artículos', async () => {
    (mockCategoria.findOne as jest.Mock).mockResolvedValue(mockRow);
    (mockArticulo.count as jest.Mock).mockResolvedValue(5);
    await expect(service.delete(1)).rejects.toThrow('5 artículo(s) dependen de esta categoría');
    expect(mockRow.destroy).not.toHaveBeenCalled();
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockCategoria.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.delete(999)).rejects.toThrow('Categoría no encontrada');
  });
});
