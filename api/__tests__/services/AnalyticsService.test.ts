/**
 * AnalyticsService — Test Suite
 * Patrón data-driven con arrays de casos y runner simple.
 */

jest.mock('../../src/common/database/mysql', () => ({
  sequelize: {
    query: jest.fn(),
    Model: class MockModel {},
  },
}));

import { sequelize } from '../../src/common/database/mysql';
import { AnalyticsService } from '../../src/services/AnalyticsService';

const mockQuery = sequelize.query as jest.Mock;
let service: AnalyticsService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new AnalyticsService();
});

function runCases<T>(cases: { name: string; mocks: any[][]; params: any[]; expected: T }[], fn: (...args: any[]) => Promise<T>) {
  cases.forEach(({ name, mocks, params, expected }) => {
    it(name, async () => {
      jest.clearAllMocks();
      mocks.forEach((r: any) => mockQuery.mockResolvedValueOnce(r));
      const result = await fn(...params);
      expect(result).toEqual(expected);
    });
  });
}

// ============================================================
// getOverview
// ============================================================
describe('getOverview', () => {
  runCases([
    {
      name: 'debe retornar overview completo con ambos períodos con datos',
      // fetchPeriod llama 3 queries en Promise.all: ventas, compras, dte
      // Primero se ejecuta fetchPeriod(from,to), luego fetchPeriod(prevFrom,prevTo)
      mocks: [
        [{ docs: 10, facturas: 5, tickets: 3, boletas: 2, total: 10000, iva: 1200 }],
        [{ count: 5, total: 4000 }],
        [{ count: 5, total: 10000 }],
        [{ docs: 8, facturas: 4, tickets: 2, boletas: 2, total: 8000, iva: 960 }],
        [{ count: 4, total: 3000 }],
        [{ count: 4, total: 8000 }],
      ],
      params: ['2026-07-01', '2026-07-31'],
      expected: {
        periodo: { desde: '2026-07-01', hasta: '2026-07-31', prevDesde: '2026-06-01', prevHasta: '2026-06-30' },
        current: { totalVentas: 10000, totalCompras: 4000, ganancia: 6000, ivaFacturas: 1200, documentos: 10, facturas: 5, tickets: 3, boletas: 2, comprasCount: 5, dteCount: 5, dteTotal: 10000 },
        previous: { totalVentas: 8000, totalCompras: 3000, ganancia: 5000, ivaFacturas: 960, documentos: 8, facturas: 4, tickets: 2, boletas: 2, comprasCount: 4, dteCount: 4, dteTotal: 8000 },
        comparacion: {
          ventas: { cambio: 25 },
          compras: { cambio: expect.closeTo(33.33, 1) },
          ganancia: { cambio: 20 },
          documentos: { cambio: 25 },
        },
      },
    },
    {
      name: 'debe retornar 100% de cambio cuando período anterior es 0',
      mocks: [
        [{ docs: 5, facturas: 3, tickets: 1, boletas: 1, total: 5000, iva: 600 }],
        [{ count: 2, total: 2000 }],
        [{ count: 2, total: 5000 }],
        [{ docs: 0, facturas: 0, tickets: 0, boletas: 0, total: 0, iva: 0 }],
        [{ count: 0, total: 0 }],
        [{ count: 0, total: 0 }],
      ],
      params: ['2026-07-01', '2026-07-31'],
      expected: {
        periodo: { desde: '2026-07-01', hasta: '2026-07-31', prevDesde: '2026-06-01', prevHasta: '2026-06-30' },
        current: { totalVentas: 5000, totalCompras: 2000, ganancia: 3000, ivaFacturas: 600, documentos: 5, facturas: 3, tickets: 1, boletas: 1, comprasCount: 2, dteCount: 2, dteTotal: 5000 },
        previous: { totalVentas: 0, totalCompras: 0, ganancia: 0, ivaFacturas: 0, documentos: 0, facturas: 0, tickets: 0, boletas: 0, comprasCount: 0, dteCount: 0, dteTotal: 0 },
        comparacion: {
          ventas: { cambio: 100 },
          compras: { cambio: 100 },
          ganancia: { cambio: 100 },
          documentos: { cambio: 100 },
        },
      },
    },
    {
      name: 'debe retornar 0 cuando ambos períodos están vacíos',
      mocks: [
        [{ docs: 0, facturas: 0, tickets: 0, boletas: 0, total: 0, iva: 0 }],
        [{ count: 0, total: 0 }],
        [{ count: 0, total: 0 }],
        [{ docs: 0, facturas: 0, tickets: 0, boletas: 0, total: 0, iva: 0 }],
        [{ count: 0, total: 0 }],
        [{ count: 0, total: 0 }],
      ],
      params: ['2026-07-01', '2026-07-31'],
      expected: {
        periodo: { desde: '2026-07-01', hasta: '2026-07-31', prevDesde: '2026-06-01', prevHasta: '2026-06-30' },
        current: { totalVentas: 0, totalCompras: 0, ganancia: 0, ivaFacturas: 0, documentos: 0, facturas: 0, tickets: 0, boletas: 0, comprasCount: 0, dteCount: 0, dteTotal: 0 },
        previous: { totalVentas: 0, totalCompras: 0, ganancia: 0, ivaFacturas: 0, documentos: 0, facturas: 0, tickets: 0, boletas: 0, comprasCount: 0, dteCount: 0, dteTotal: 0 },
        comparacion: {
          ventas: { cambio: 0 },
          compras: { cambio: 0 },
          ganancia: { cambio: 0 },
          documentos: { cambio: 0 },
        },
      },
    },
  ], (from: string, to: string) => service.getOverview(from, to));
});

// ============================================================
// getDailyTrend
// ============================================================
describe('getDailyTrend', () => {
  runCases([
    {
      name: 'debe retornar ventas agrupadas por día',
      mocks: [[
        { dia: '2026-07-01', ventas: 1000, iva: 120, documentos: 3 },
        { dia: '2026-07-02', ventas: 1500, iva: 180, documentos: 5 },
      ]],
      params: ['2026-07-01', '2026-07-31'],
      expected: [
        { dia: '2026-07-01', ventas: 1000, iva: 120, documentos: 3 },
        { dia: '2026-07-02', ventas: 1500, iva: 180, documentos: 5 },
      ],
    },
    {
      name: 'debe retornar array vacío si no hay ventas',
      mocks: [[]],
      params: ['2026-07-01', '2026-07-31'],
      expected: [],
    },
  ], (from: string, to: string) => service.getDailyTrend(from, to));
});

// ============================================================
// getTopProducts
// ============================================================
describe('getTopProducts', () => {
  runCases([
    {
      name: 'debe retornar top productos ordenados por cantidad',
      mocks: [[
        { codigo: 'P001', nombre: 'Producto A', categoria: 'Cat1', cantidad: 50, total: 5000 },
        { codigo: 'P002', nombre: 'Producto B', categoria: 'Cat2', cantidad: 30, total: 3000 },
      ]],
      params: ['2026-07-01', '2026-07-31', 10],
      expected: [
        { codigo: 'P001', nombre: 'Producto A', categoria: 'Cat1', cantidad: 50, total: 5000 },
        { codigo: 'P002', nombre: 'Producto B', categoria: 'Cat2', cantidad: 30, total: 3000 },
      ],
    },
    {
      name: 'debe retornar array vacío si no hay ventas',
      mocks: [[]],
      params: ['2026-07-01', '2026-07-31', 10],
      expected: [],
    },
  ], (from: string, to: string, limit: number) => service.getTopProducts(from, to, limit));
});

// ============================================================
// getSalesByType
// ============================================================
describe('getSalesByType', () => {
  runCases([
    {
      name: 'debe retornar ventas agrupadas por tipo comprobante',
      mocks: [[
        { tipo_comprobante: 'Factura', documentos: 5, total: 5000 },
        { tipo_comprobante: 'Ticket', documentos: 3, total: 1500 },
        { tipo_comprobante: 'Boleta', documentos: 2, total: 800 },
      ]],
      params: ['2026-07-01', '2026-07-31'],
      expected: [
        { tipo: 'Factura', documentos: 5, total: 5000 },
        { tipo: 'Ticket', documentos: 3, total: 1500 },
        { tipo: 'Boleta', documentos: 2, total: 800 },
      ],
    },
    {
      name: 'debe retornar array vacío si no hay ventas',
      mocks: [[]],
      params: ['2026-07-01', '2026-07-31'],
      expected: [],
    },
  ], (from: string, to: string) => service.getSalesByType(from, to));
});

// ============================================================
// getCategoryBreakdown
// ============================================================
describe('getCategoryBreakdown', () => {
  runCases([
    {
      name: 'debe retornar ventas por categoría',
      mocks: [[
        { categoria: 'Bebidas', cantidad: 100, total: 5000 },
        { categoria: 'Comida', cantidad: 50, total: 3000 },
      ]],
      params: ['2026-07-01', '2026-07-31'],
      expected: [
        { categoria: 'Bebidas', cantidad: 100, total: 5000 },
        { categoria: 'Comida', cantidad: 50, total: 3000 },
      ],
    },
    {
      name: 'debe retornar array vacío si no hay datos',
      mocks: [[]],
      params: ['2026-07-01', '2026-07-31'],
      expected: [],
    },
  ], (from: string, to: string) => service.getCategoryBreakdown(from, to));
});

// ============================================================
// getDayOfWeek
// ============================================================
describe('getDayOfWeek', () => {
  runCases([
    {
      name: 'debe retornar ventas con nombre de día correcto',
      mocks: [[
        { dia_num: 2, ventas: 2000, documentos: 5 },
        { dia_num: 4, ventas: 3000, documentos: 8 },
        { dia_num: 7, ventas: 5000, documentos: 12 },
      ]],
      params: ['2026-07-01', '2026-07-31'],
      expected: [
        { dia: 'Lun', ventas: 2000, documentos: 5 },
        { dia: 'Mié', ventas: 3000, documentos: 8 },
        { dia: 'Sáb', ventas: 5000, documentos: 12 },
      ],
    },
  ], (from: string, to: string) => service.getDayOfWeek(from, to));
});

// ============================================================
// getMonthlyTrend
// ============================================================
describe('getMonthlyTrend', () => {
  runCases([
    {
      name: 'debe retornar tendencia mensual',
      mocks: [
        [{ mes: '2026-01', ventas: 10000, iva: 1200, documentos: 30 },
         { mes: '2026-02', ventas: 12000, iva: 1440, documentos: 35 }],
        [{ mes: '2026-01', total: 5000 },
         { mes: '2026-02', total: 6000 }],
      ],
      params: ['2026-01-01', '2026-12-31'],
      expected: [
        { mes: '2026-01', ventas: 10000, compras: 5000, iva: 1200, documentos: 30 },
        { mes: '2026-02', ventas: 12000, compras: 6000, iva: 1440, documentos: 35 },
      ],
    },
    {
      name: 'debe retornar compras en 0 cuando el mes no tiene compras',
      mocks: [
        [{ mes: '2026-01', ventas: 5000, iva: 600, documentos: 10 }],
        [{ mes: '2026-02', total: 3000 }],
      ],
      params: ['2026-01-01', '2026-12-31'],
      expected: [
        { mes: '2026-01', ventas: 5000, compras: 0, iva: 600, documentos: 10 },
      ],
    },
  ], (from: string, to: string) => service.getMonthlyTrend(from, to));
});

// ============================================================
// getWeeklyComparison
// ============================================================
describe('getWeeklyComparison', () => {
  runCases([
    {
      name: 'debe retornar comparación semanal',
      mocks: [[
        { semana: 202627, ventas: 5000, documentos: 15 },
        { semana: 202628, ventas: 6000, documentos: 18 },
      ]],
      params: ['2026-07-01', '2026-07-31'],
      expected: [
        { semana: 202627, ventas: 5000, documentos: 15 },
        { semana: 202628, ventas: 6000, documentos: 18 },
      ],
    },
  ], (from: string, to: string) => service.getWeeklyComparison(from, to));
});
