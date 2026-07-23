import { GET, route, before } from 'awilix-express';
import { Request, Response } from 'express';
import { param, query } from 'express-validator';
import { BaseController } from '../common/base/base.controller';
import { InventoryService } from '../services/InventoryService';
import { validateFields } from '../common/middleware/validate-fields';
import { requireSucursal, AuthRequest } from '../common/middleware/auth.middleware';
@route('/inventory')
export class InventoryController extends BaseController {
  constructor(private readonly inventoryService: InventoryService) {
    super();
  }
  /**
   * GET /inventory/stock/:idarticulo
   * Stock de un artículo en la sucursal activa
   */
  @route('/stock/:idarticulo')
  @GET()
  @before([
    requireSucursal,
    param('idarticulo').isInt().withMessage('El ID debe ser un número entero'),
    validateFields
  ])
  public async getStock(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.idarticulo as string);
      const stock = await this.inventoryService.getStock(id);
      res.json({ stock });
    } catch (error) {
      this.handleException(error, res);
    }
  }
  /**
   * GET /inventory/low-stock?threshold=5
   * Artículos con stock bajo en la sucursal activa
   */
  @route('/low-stock')
  @GET()
  @before([requireSucursal])
  public async getLowStock(req: AuthRequest, res: Response) {
    try {
      const threshold = parseInt(req.query.threshold as string) || 5;
      const rows = await this.inventoryService.getLowStock(threshold);
      res.json(rows);
    } catch (error) {
      this.handleException(error, res);
    }
  }
}

