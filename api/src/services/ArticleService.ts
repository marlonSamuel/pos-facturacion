import { ApplicationException } from '../common/errors/application.exception';
import { Articulo, Categoria, ArticuloSucursal, Sucursal } from '../models';
import { Op } from 'sequelize';
import { sequelize } from '../common/database/mysql';
import { IArticuloDto } from '../dtos/ICategoria';
import { comercioFilter, getComercioId, getSucursalId } from '../common/request-context';
import path from 'path';
import fs from 'fs';
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/products');
export class ArticleService {
  private stockInclude() {
    const sucId = getSucursalId() || 1;
    return [{
      model: ArticuloSucursal, as: 'inventario',
      where: { idsucursal: sucId },
      attributes: ['stock'],
      required: false
    }];
  }
  private mapRows(rows: any[]) {
    return rows.map((r: any) => {
      const d = r.get({ plain: true });
      d.stock = d.inventario?.[0]?.stock ?? 0;
      delete d.inventario;
      return d;
    });
  }
  private baseIncludes() {
    return [
      { model: Categoria, as: 'categoria', attributes: ['nombre'] },
      ...this.stockInclude()
    ];
  }
  async getAll() {
    try {
      const rows = await Articulo.findAll({
        where: { ...comercioFilter(), condicion: 1 },
        include: this.baseIncludes()
      });
      return this.mapRows(rows);
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getAllPaginated(page: number = 1, pageSize: number = 10, includeInactive: boolean = false) {
    try {
      const where: any = { ...comercioFilter() };
      if (!includeInactive) where.condicion = 1;
      const offset = (page - 1) * pageSize;
      const { rows, count } = await Articulo.findAndCountAll({
        where,
        include: this.baseIncludes(),
        order: [['nombre', 'ASC']],
        limit: pageSize,
        offset,
      });
      return { rows: this.mapRows(rows), total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getAllIncludingInactive() {
    try {
      const rows = await Articulo.findAll({
        where: { ...comercioFilter() },
        include: this.baseIncludes()
      });
      return this.mapRows(rows);
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getActiveForSale() {
    try {
      const rows = await Articulo.findAll({
        where: { ...comercioFilter(), condicion: 1 },
        include: this.baseIncludes()
      });
      return this.mapRows(rows);
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async search(q: string, limit = 20, offset = 0, categoryId?: number) {
    try {
      const where: any = { ...comercioFilter(), condicion: 1 };
      if (q && q.trim()) {
        const term = `%${q.trim()}%`;
        where[Op.or] = [
          { nombre: { [Op.like]: term } },
          { codigo: { [Op.like]: term } }
        ];
      }
      if (categoryId && categoryId !== 0) {
        where.idcategoria = categoryId;
      }
      const { rows, count } = await Articulo.findAndCountAll({
        where,
        include: this.baseIncludes(),
        limit,
        offset,
        order: [['nombre', 'ASC']]
      });
      const mapped = this.mapRows(rows);
      // Agregar stock por sucursal para el PriceChecker
      if (mapped.length > 0) {
        const ids = mapped.map((r: any) => r.idarticulo);
        const stockRows = await ArticuloSucursal.findAll({
          where: { idarticulo: ids },
          include: [{ model: Sucursal, as: 'sucursal', attributes: ['nombre'] }],
          attributes: ['idarticulo', 'idsucursal', 'stock'],
        });
        const sucursalActual = getSucursalId();
        for (const article of mapped) {
          (article as any).stockPorSucursal = stockRows
            .filter((sr: any) => sr.idarticulo === article.idarticulo)
            .map((sr: any) => ({
              idsucursal: sr.idsucursal,
              nombre: (sr as any).sucursal?.nombre || `Sucursal ${sr.idsucursal}`,
              stock: sr.stock,
              actual: sr.idsucursal === sucursalActual,
            }));
        }
      }
      return { rows: mapped, total: count, limit, offset };
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getLastPurchasePrice(articleId: number) {
    try {
      const [row] = await sequelize.query(
        `SELECT di.precio_compra, di.precio_venta FROM detalle_ingreso di
         JOIN ingreso i ON di.idingreso = i.idingreso
         WHERE di.idarticulo = :idarticulo
         ORDER BY di.iddetalle_ingreso DESC LIMIT 1`,
        { replacements: { idarticulo: articleId }, type: 'SELECT' }
      );
      return {
        precio_compra: (row as any)?.precio_compra
          ? parseFloat((row as any).precio_compra) : null,
        precio_venta: (row as any)?.precio_venta
          ? parseFloat((row as any).precio_venta) : null
      };
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getById(id: number) {
    try {
      const row = await Articulo.findOne({
        where: { idarticulo: id, ...comercioFilter() },
        include: this.baseIncludes()
      });
      if (!row) throw new ApplicationException('Articulo no encontrado', 404);
      const data = row.get({ plain: true });
      data.stock = data.inventario?.[0]?.stock ?? 0;
      delete data.inventario;
      return data;
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: IArticuloDto, imagen?: string) {
    try {
      // Validar precio_venta > 0
      const precioVenta = parseFloat(data.precio_venta as any);
      if (!precioVenta || precioVenta <= 0) {
        throw new ApplicationException('El precio de venta debe ser mayor a cero');
      }
      const payload: any = { idcomercio: getComercioId(), ...data };
      const stockInicial = parseInt(payload.stock) || 0;
      delete payload.stock;
      if (imagen) payload.imagen = imagen;
      const article = await Articulo.create(payload);
      const idarticulo = (article as any).idarticulo;
      // Crear stock inicial en la sucursal activa
      const idsucursal = getSucursalId();
      if (idsucursal && stockInicial > 0) {
        await ArticuloSucursal.create({ idarticulo, idsucursal, stock: stockInicial });
      }
      return article;
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async update(id: number, data: IArticuloDto, imagen?: string) {
    try {
      // Validar precio_venta > 0 si se envía
      if (data.precio_venta !== undefined) {
        const precioVenta = parseFloat(data.precio_venta as any);
        if (!precioVenta || precioVenta <= 0) {
          throw new ApplicationException('El precio de venta debe ser mayor a cero');
        }
      }
      const row = await Articulo.findOne({ where: { idarticulo: id, ...comercioFilter() } });
      if (!row) throw new ApplicationException('Articulo no encontrado', 404);
      const payload: any = { ...data };
      const nuevoStock = payload.stock !== undefined ? parseInt(payload.stock) : undefined;
      delete payload.stock;
      if (imagen) {
        const oldData = row.get() as any;
        if (oldData.imagen && oldData.imagen !== 'default.png') {
          const oldPath = path.join(UPLOADS_DIR, oldData.imagen);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        payload.imagen = imagen;
      }
      await row.update(payload);
      // Actualizar stock si se envió y hay sucursal activa
      if (nuevoStock !== undefined) {
        const idsucursal = getSucursalId();
        if (idsucursal) {
          const existing = await ArticuloSucursal.findOne({ where: { idarticulo: id, idsucursal } });
          if (existing) {
            await existing.update({ stock: nuevoStock });
          } else {
            await ArticuloSucursal.create({ idarticulo: id, idsucursal, stock: nuevoStock });
          }
        }
      }
      return row;
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async delete(id: number) {
    try {
      const row = await Articulo.findOne({ where: { idarticulo: id, ...comercioFilter() } });
      if (!row) throw new ApplicationException('Articulo no encontrado', 404);
      const oldData = row.get() as any;
      if (oldData.imagen) {
        const imgPath = path.join(UPLOADS_DIR, oldData.imagen);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
      await row.destroy();
      return { ok: true };
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
}
