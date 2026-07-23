/**
 * Helpers para mocking de Sequelize en tests unitarios.
 * Se mockea `sequelize.query()` para que devuelva datos controlados.
 */

type QueryResult = any[] | any;

interface MockQueryHandler {
  (sql: string, options?: any): Promise<QueryResult>;
}

/**
 * Crea un mock del módulo '../common/database/mysql'
 * con un `sequelize.query` controlado por `mockQuery`.
 */
export function createMockSequelize(mockQuery: MockQueryHandler) {
  const mockSequelize = {
    query: mockQuery,
    authenticate: jest.fn().mockResolvedValue(undefined),
    define: jest.fn(),
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
    fn: jest.fn((name: string) => name),
    col: jest.fn((name: string) => name),
    literal: jest.fn((val: string) => val),
    where: jest.fn(),
    Model: class MockModel {
      static findAll = jest.fn();
      static findByPk = jest.fn();
      static create = jest.fn();
      static update = jest.fn();
      static findOne = jest.fn();
      static findAndCountAll = jest.fn();
      static count = jest.fn();
      static increment = jest.fn();
      static destroy = jest.fn();
    },
  };

  return mockSequelize;
}

/**
 * Crea un mock de modelo Sequelize con métodos básicos.
 */
export function mockModel(overrides?: Record<string, jest.Mock>) {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    increment: jest.fn(),
    upsert: jest.fn(),
    ...overrides,
  };
}

/**
 * Mock de sequelize.literal para test (retorna el string literal).
 */
export const literal = (val: string) => val;

/**
 * Helper: ejecuta un test con mock de sequelize.query
 */
export function mockQueryOnce(mock: jest.Mock, result: any[]) {
  mock.mockResolvedValueOnce(result);
}

export function mockQueryMultiple(mock: jest.Mock, results: any[][]) {
  results.forEach(r => mock.mockResolvedValueOnce(r));
}
