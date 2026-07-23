/**
 * Helpers de paginación reutilizables para servicios Sequelize.
 * Uso: const { rows, total, page, pageSize } = await paginate(Model, { ... }, req.query);
 */
import { Model, ModelStatic, FindOptions } from 'sequelize';
export interface PaginationParams {
  page: number;
  pageSize: number;
}
export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
/**
 * Extrae parámetros de paginación desde query string.
 * @param query  req.query (los query params del controller)
 * @param defaults  page y pageSize por defecto
 */
export function getPaginationParams(
  query: { page?: string; pageSize?: string },
  defaults: { page: number; pageSize: number } = { page: 1, pageSize: 50 }
): PaginationParams {
  return {
    page: Math.max(1, parseInt(query.page || '') || defaults.page),
    pageSize: Math.max(1, Math.min(100, parseInt(query.pageSize || '') || defaults.pageSize)),
  };
}
/**
 * Ejecuta findAll + count en una sola consulta con paginación.
 * @param model     Modelo Sequelize (ej: Venta, Articulo)
 * @param options   Opciones de FindOptions (where, include, order, etc.)
 * @param pagination { page, pageSize }
 */
export async function paginate<T extends Model>(
  model: ModelStatic<T>,
  options: FindOptions,
  pagination: PaginationParams
): Promise<PaginatedResult<T>> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const { rows, count } = await model.findAndCountAll({
    ...options,
    limit: pageSize,
    offset,
  });
  return {
    rows: rows as unknown as T[],
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

