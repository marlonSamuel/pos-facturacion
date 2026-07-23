import { Request, Response, NextFunction } from 'express';
import { requestContext, IRequestContext } from '../request-context';
/**
 * Middleware que extrae el auth del JWT y lo inyecta en AsyncLocalStorage.
 * Los services acceden al contexto vía getRequestContext() sin necesidad de parámetros.
 * Debe ejecutarse DESPUÉS de express-jwt.
 */
export const injectRequestContext = (req: Request, _res: Response, next: NextFunction) => {
  const auth = (req as any).auth;
  const ctx: IRequestContext = {
    id: auth?.id,
    username: auth?.username,
    idrol: auth?.idrol ?? null,
    idcomercio: auth?.idcomercio ?? null,
    idsucursal: auth?.idsucursal ?? null,
    sucursales: auth?.sucursales || [],
  };
  requestContext.run(ctx, () => next());
};
