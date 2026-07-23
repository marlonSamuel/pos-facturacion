import { AsyncLocalStorage } from 'async_hooks';
export interface IRequestContext {
  id: number;
  username: string;
  idrol: number | null;
  idcomercio: number | null;
  idsucursal: number | null;
  sucursales: number[];
}
export const requestContext = new AsyncLocalStorage<IRequestContext>();
/**
 * Obtiene el contexto del request actual (sin pasarlo por parámetros).
 * Retorna undefined si no hay contexto activo (fuera de un request HTTP).
 */
export function getRequestContext(): IRequestContext | undefined {
  return requestContext.getStore();
}
/**
 * Helper para filtrar queries Sequelize por sucursal activa.
 * Aplica para todos los usuarios según la sucursal seleccionada en el JWT.
 * Uso: Articulo.findAll({ where: { ...sucursalFilter(), condicion: 1 } })
 */
export function sucursalFilter(alias = ''): Record<string, any> {
  const ctx = getRequestContext();
  if (!ctx || !ctx.idsucursal) return {};
  return { [`${alias}idsucursal`]: ctx.idsucursal };
}
/**
 * Helper para filtrar queries Sequelize por comercio activo.
 * Aplica para todos los usuarios según el comercio del JWT.
 * Uso: Categoria.findAll({ where: { ...comercioFilter(), condicion: 1 } })
 */
export function comercioFilter(alias = ''): Record<string, any> {
  const ctx = getRequestContext();
  if (!ctx || !ctx.idcomercio) return {};
  return { [`${alias}idcomercio`]: ctx.idcomercio };
}
/**
 * Helper para obtener el idsucursal del contexto (para crear registros).
 */
export function getSucursalId(): number | null {
  const ctx = getRequestContext();
  return ctx?.idsucursal ?? null;
}
/**
 * Helper para obtener el idcomercio del contexto.
 */
export function getComercioId(): number | null {
  const ctx = getRequestContext();
  return ctx?.idcomercio ?? null;
}
/**
 * Helper para obtener el id del usuario desde el contexto.
 */
export function getUserId(): number | null {
  const ctx = getRequestContext();
  return ctx?.id ?? null;
}
/**
 * Helper para filtrar solo registros del usuario actual (no admin).
 * Admin (idrol=1) omite el filtro.
 * Uso: Venta.findAll({ where: { ...sucursalFilter(), ...selfFilter('idusuario') } })
 */
export function selfFilter(field = 'idusuario'): Record<string, any> {
  const ctx = getRequestContext();
  if (!ctx || ctx.idrol === 1 || !ctx.id) return {};
  return { [field]: ctx.id };
}
/**
 * Verifica si el usuario actual es admin global.
 */
export function isAdmin(): boolean {
  const ctx = getRequestContext();
  return ctx?.idrol === 1;
}

