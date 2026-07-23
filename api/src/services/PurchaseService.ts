import { ApplicationException } from '../common/errors/application.exception';
import { Ingreso, DetalleIngreso, Person, Articulo, ArticuloSucursal, Usuario, Sucursal } from '../models';
import { IIngresoDto, IIngresoResponse } from '../dtos/IPurchase';
import { sequelize } from '../common/database/mysql';
import { sucursalFilter, getSucursalId } from '../common/request-context';
export class PurchaseService {
  async getAll(): Promise<IIngresoResponse[]> {
    try {
      const rows = await Ingreso.findAll({
        where: { ...sucursalFilter() },
        include: [
          { model: Person, as: 'proveedor', attributes: ['nombre'] },
          { model: Usuario, as: 'usuario', attributes: ['nombre'] },
          { model: Sucursal, as: 'sucursal', attributes: ['nombre'] }
        ],
        order: [['idingreso', 'DESC']]
      });
      return rows.map((r: any) => this.mapHeader(r));
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getAllPaginated(page: number = 1, pageSize: number = 10, estado?: string): Promise<{ rows: IIngresoResponse[]; total: number; page: number; pageSize: number; totalPages: number }> {
    try {
      const offset = (page - 1) * pageSize;
      const whereFilter: any = { ...sucursalFilter() };
      if (estado && estado !== 'Todas') whereFilter.estado = estado;
      const { rows, count } = await Ingreso.findAndCountAll({
        where: whereFilter,
        include: [
          { model: Person, as: 'proveedor', attributes: ['nombre'] },
          { model: Usuario, as: 'usuario', attributes: ['nombre'] },
          { model: Sucursal, as: 'sucursal', attributes: ['nombre'] }
        ],
        order: [['idingreso', 'DESC']],
        limit: pageSize,
        offset,
      });
      return {
        rows: rows.map((r: any) => this.mapHeader(r)),
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      };
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getById(id: number): Promise<IIngresoResponse> {
    try {
      const row = await Ingreso.findOne({
        where: { idingreso: id, ...sucursalFilter() },
        include: [
          { model: Person, as: 'proveedor', attributes: ['nombre'] },
          { model: Usuario, as: 'usuario', attributes: ['nombre'] },
          { model: Sucursal, as: 'sucursal', attributes: ['nombre'] },
          {
            model: DetalleIngreso, as: 'detalles',
            include: [{ model: Articulo, as: 'articulo', attributes: ['nombre'] }]
          }
        ]
      });
      if (!row) throw new ApplicationException('Ingreso no encontrado', 404);
      return this.mapDetail(row as any);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: IIngresoDto, userId: number): Promise<IIngresoResponse> {
    // Validar que total_compra > 0
    if (!data.total_compra || data.total_compra <= 0) {
      throw new ApplicationException('El total de la compra debe ser mayor a cero');
    }
    if (!data.detalles || data.detalles.length === 0) {
      throw new ApplicationException('La compra debe tener al menos un artículo');
    }
    for (const det of data.detalles) {
      if (!det.cantidad || det.cantidad <= 0) {
        throw new ApplicationException('La cantidad de cada artículo debe ser mayor a cero');
      }
      if (!det.precio_compra || det.precio_compra <= 0) {
        throw new ApplicationException('El precio de compra de cada artículo debe ser mayor a cero');
      }
      if (!det.precio_venta || det.precio_venta <= 0) {
        throw new ApplicationException('El precio de venta de cada artículo debe ser mayor a cero');
      }
    }
    const transaction = await sequelize.transaction();
    try {
      // Validar proveedor
      const provider = await Person.findByPk(data.idproveedor, { transaction });
      if (!provider) throw new ApplicationException('Proveedor no encontrado', 404);
      // Crear cabecera
      const ingreso = await Ingreso.create({
        idsucursal: getSucursalId(),
        idproveedor: data.idproveedor,
        idusuario: userId,
        tipo_comprobante: data.tipo_comprobante,
        serie_comprobante: data.serie_comprobante || null,
        num_comprobante: data.num_comprobante,
        fecha_hora: data.fecha_hora,
        impuesto: data.impuesto || 0,
        total_compra: data.total_compra,
        estado: 'Aceptado'
      } as any, { transaction });
      const ingresoId = (ingreso as any).idingreso;
      // Insertar detalle y actualizar stock
      for (const det of data.detalles) {
        await DetalleIngreso.create({
          idingreso: ingresoId,
          idarticulo: det.idarticulo,
          cantidad: det.cantidad,
          precio_compra: det.precio_compra,
          precio_venta: det.precio_venta
        } as any, { transaction });
        // Actualizar stock (+ cantidad) en sucursal activa
        const sucId = getSucursalId();
        // Upsert: si no existe registro de stock, crearlo
        const existing = await ArticuloSucursal.findOne({
          where: { idarticulo: det.idarticulo, idsucursal: sucId },
          transaction
        });
        if (existing) {
          await ArticuloSucursal.update(
            { stock: sequelize.literal(`stock + ${det.cantidad}`) },
            { where: { idarticulo: det.idarticulo, idsucursal: sucId }, transaction }
          );
        } else {
          await ArticuloSucursal.create({
            idarticulo: det.idarticulo,
            idsucursal: sucId,
            stock: det.cantidad
          } as any, { transaction });
        }
      }
      await transaction.commit();
      return await this.getById(ingresoId);
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async cancel(id: number, motivo?: string): Promise<{ ok: boolean }> {
    const transaction = await sequelize.transaction();
    try {
      const row = await Ingreso.findOne({
        where: { idingreso: id, ...sucursalFilter() },
        include: [{ model: DetalleIngreso, as: 'detalles' }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!row) throw new ApplicationException('Ingreso no encontrado', 404);
      const data = row.get() as any;
      if (data.estado === 'Anulado') {
        throw new ApplicationException('El ingreso ya está anulado');
      }
      // Restar stock (revertir) en sucursal activa
      const ingData = row.get() as any;
      const sucIdCancel = getSucursalId();
      if (data.detalles) {
        for (const det of data.detalles) {
          const detData = det.get ? det.get() : det;
          await ArticuloSucursal.update(
            { stock: sequelize.literal(`stock - ${detData.cantidad}`) },
            { where: { idarticulo: detData.idarticulo, idsucursal: sucIdCancel }, transaction }
          );
        }
      }
      await Ingreso.update(
        { estado: 'Anulado', motivo_anulacion: motivo || null },
        { where: { idingreso: id }, transaction }
      );
      await transaction.commit();
      return { ok: true };
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  private mapHeader(row: any): IIngresoResponse {
    const d = row.get ? row.get() : row;
    return {
      idingreso: d.idingreso,
      idproveedor: d.idproveedor,
      proveedor: d.proveedor?.nombre,
      idusuario: d.idusuario,
      usuario: d.usuario?.nombre,
      tipo_comprobante: d.tipo_comprobante,
      serie_comprobante: d.serie_comprobante,
      num_comprobante: d.num_comprobante,
      fecha_hora: d.fecha_hora,
      impuesto: parseFloat(d.impuesto) || 0,
      total_compra: parseFloat(d.total_compra) || 0,
      estado: d.estado,
      sucursal: d.sucursal?.nombre
    };
  }
  private mapDetail(row: any): IIngresoResponse {
    const header = this.mapHeader(row);
    const d = row.get ? row.get() : row;
    return {
      ...header,
      detalles: (d.detalles || []).map((det: any) => {
        const dd = det.get ? det.get() : det;
        return {
          iddetalle_ingreso: dd.iddetalle_ingreso,
          idarticulo: dd.idarticulo,
          articulo: dd.articulo?.nombre,
          cantidad: dd.cantidad,
          precio_compra: parseFloat(dd.precio_compra) || 0,
          precio_venta: parseFloat(dd.precio_venta) || 0
        };
      })
    };
  }
}
