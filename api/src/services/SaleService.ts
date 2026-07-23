import { ApplicationException } from '../common/errors/application.exception';
import { Venta, DetalleVenta, Person, Usuario, Articulo, ArticuloSucursal, SatFactura, Sucursal } from '../models';
import { DteService } from './DteService';
import { AuditService } from './AuditService';
import type { IVentaDto, IVentaResponse, IDetalleVentaResponse } from '../dtos/ISale';
import { sequelize } from '../common/database/mysql';
import { sucursalFilter, getSucursalId, selfFilter } from '../common/request-context';
export class SaleService {
  constructor(private readonly dteService: DteService) {}
  async getAll(): Promise<IVentaResponse[]> {
    try {
      const rows = await Venta.findAll({
        where: { ...sucursalFilter(), ...selfFilter('idusuario') },
        include: [
          { model: Person, as: 'cliente', attributes: ['nombre'] },
          { model: Usuario, as: 'usuario', attributes: ['nombre'] },
          { model: SatFactura, as: 'factura', attributes: ['autorizacion'] },
          { model: Sucursal, as: 'sucursal', attributes: ['nombre'] }
        ],
        order: [['idventa', 'DESC']]
      });
      return rows.map((r: any) => this.mapHeader(r));
    } catch (error: any) {
      throw new ApplicationException(error.message);
    }
  }
  async getAllPaginated(page: number = 1, pageSize: number = 10, estado?: string): Promise<{ rows: IVentaResponse[]; total: number; page: number; pageSize: number; totalPages: number }> {
    try {
      const offset = (page - 1) * pageSize;
      const whereFilter: any = { ...sucursalFilter(), ...selfFilter('idusuario') };
      if (estado && estado !== 'Todas') whereFilter.estado = estado;
      const { rows, count } = await Venta.findAndCountAll({
        where: whereFilter,
        include: [
          { model: Person, as: 'cliente', attributes: ['nombre'] },
          { model: Usuario, as: 'usuario', attributes: ['nombre'] },
          { model: SatFactura, as: 'factura', attributes: ['autorizacion'] },
          { model: Sucursal, as: 'sucursal', attributes: ['nombre'] }
        ],
        order: [['idventa', 'DESC']],
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
  async getById(id: number): Promise<IVentaResponse> {
    try {
      const row = await Venta.findOne({
        where: { idventa: id, ...sucursalFilter(), ...selfFilter('idusuario') },
        include: [
          { model: Person, as: 'cliente', attributes: ['nombre', 'tipo_documento', 'num_documento', 'direccion', 'email', 'telefono'] },
          { model: Usuario, as: 'usuario', attributes: ['nombre'] },
          { model: Sucursal, as: 'sucursal', attributes: ['nombre'] },
          {
            model: DetalleVenta, as: 'detalles',
            include: [{ model: Articulo, as: 'articulo', attributes: ['nombre'] }]
          },
          { model: SatFactura, as: 'factura' }
        ]
      });
      if (!row) throw new ApplicationException('Venta no encontrada', 404);
      return this.mapDetail(row as any);
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async create(data: IVentaDto, userId: number, username?: string, ip?: string): Promise<{
    idventa: number;
    serie?: string;
    num?: string;
    html?: string;
    pdfUrl?: string;
    autorizacion?: string;
  }> {
    // Validar que total_venta > 0
    if (!data.total_venta || data.total_venta <= 0) {
      throw new ApplicationException('El total de la venta debe ser mayor a cero');
    }
    if (!data.detalles || data.detalles.length === 0) {
      throw new ApplicationException('La venta debe tener al menos un artículo');
    }
    for (const det of data.detalles) {
      if (!det.cantidad || det.cantidad <= 0) {
        throw new ApplicationException('La cantidad de cada artículo debe ser mayor a cero');
      }
      if (!det.precio_venta || det.precio_venta <= 0) {
        throw new ApplicationException('El precio de venta de cada artículo debe ser mayor a cero');
      }
    }
    // Si es Factura, certificar DTE PRIMERO (antes de cualquier DB write)
    let dteHtml: string | undefined;
    let dtePdfUrl: string | undefined;
    let dteAutorizacion: string | undefined;
    let dteSerie: string | undefined;
    let dteNum: string | undefined;
    let dteResult: any = null;
    if (data.tipo_comprobante === 'Factura') {
      // Construir datos necesarios para DTE
      const ventaData: IVentaResponse = {
        idventa: 0, idcliente: data.idcliente, cliente: '',
        idusuario: userId, usuario: '',
        tipo_comprobante: data.tipo_comprobante, tipo_venta: data.tipo_venta || 'CA',
        serie_comprobante: null, num_comprobante: null,
        fecha_hora: data.fecha_hora,
        impuesto: data.impuesto || 0, total_venta: data.total_venta,
        estado: 'Aceptado', email: '', direccion: '', num_documento: ''
      };
      // Obtener cliente
      const client = await Person.findByPk(data.idcliente);
      if (!client) throw new ApplicationException('Cliente no encontrado', 404);
      const cli = client.get() as any;
      ventaData.cliente = cli.nombre;
      ventaData.email = cli.email || '';
      ventaData.direccion = cli.direccion || '';
      ventaData.num_documento = cli.num_documento || '';
      // Construir detalle
      const detalleFactura: IDetalleVentaResponse[] = data.detalles.map((det, idx) => ({
        iddetalle_venta: idx,
        idarticulo: det.idarticulo, articulo: '',
        cantidad: det.cantidad, precio_venta: det.precio_venta,
        descuento: det.descuento || 0,
        subtotal: (det.cantidad * det.precio_venta) - (det.descuento || 0)
      }));
      // Obtener nombres de artículos en paralelo
      const articulos = await Articulo.findAll({
        where: { idarticulo: data.detalles.map(d => d.idarticulo) },
        attributes: ['idarticulo', 'nombre']
      });
      const artMap = Object.fromEntries(articulos.map(a => {
        const r = a.get() as any;
        return [r.idarticulo, r.nombre];
      }));
      for (const det of detalleFactura) det.articulo = artMap[det.idarticulo] || '';
      // Certificar DTE (antes de la transacción) â todo o nada
      try {
        dteResult = await this.dteService.certificar(ventaData, detalleFactura);
        if (!dteResult.rpta) {
          AuditService.registrar(username ?? null, 'DTE_ERROR', 'venta', undefined,
            JSON.stringify({ error: dteResult.message, idcliente: data.idcliente, total: data.total_venta, tipo: 'FACTURA' }), ip);
          throw new ApplicationException(
            `Error al certificar DTE: ${dteResult.message}. La venta no fue registrada.`
          );
        }
      } catch (error: any) {
        // Audita también fallos de conexión, token, etc.
        AuditService.registrar(username ?? null, 'DTE_ERROR', 'venta', undefined,
          JSON.stringify({ error: error.message, idcliente: data.idcliente, total: data.total_venta, tipo: 'FACTURA' }), ip);
        throw error instanceof ApplicationException ? error : new ApplicationException(error.message);
      }
      dteSerie = dteResult.serie;
      dteNum = dteResult.num;
      dteHtml = dteResult.html;
      dteAutorizacion = dteResult.autorizacion;
      dtePdfUrl = dteResult.pdfUrl;
    }
    // âââ Transacción: crear venta + descontar stock + guardar sat_facturas âââ
    const transaction = await sequelize.transaction();
    try {
      // Validar stock en sucursal activa
      const sucursalActual = getSucursalId();
      for (const det of data.detalles) {
        const article = await Articulo.findByPk(det.idarticulo, { transaction });
        if (!article) throw new ApplicationException(`Artículo ID ${det.idarticulo} no encontrado`, 404);
        const artName = (article.get() as any).nombre;
        const invRow = await ArticuloSucursal.findOne({
          where: { idarticulo: det.idarticulo, idsucursal: sucursalActual },
          transaction
        });
        const stockDisp = invRow ? (invRow.get() as any).stock || 0 : 0;
        if (stockDisp < det.cantidad) {
          throw new ApplicationException(
            `Stock insuficiente para "${artName}": disponible ${stockDisp}, requerido ${det.cantidad}`
          );
        }
      }
      // Crear cabecera
      const venta = await Venta.create({
        idsucursal: getSucursalId(),
        idcliente: data.idcliente,
        idusuario: userId,
        tipo_comprobante: data.tipo_comprobante,
        tipo_venta: data.tipo_venta || 'CA',
        serie_comprobante: dteSerie || data.serie_comprobante || null,
        num_comprobante: dteNum || data.num_comprobante || null,
        fecha_hora: data.fecha_hora,
        impuesto: data.impuesto || 0,
        total_venta: data.total_venta,
        estado: 'Aceptado'
      } as any, { transaction });
      const ventaId = (venta as any).idventa;
      // Generar serie + número para Boleta/Ticket
      let serieGen = dteSerie || data.serie_comprobante || null;
      let numGen = dteNum || data.num_comprobante || null;
      if (data.tipo_comprobante !== 'Factura' && (!serieGen || !numGen)) {
        const prefix = data.tipo_comprobante === 'Ticket' ? 'T' : 'B';
        serieGen = `${prefix}${String(ventaId).padStart(3, '0')}`;
        numGen = String(ventaId).padStart(6, '0');
        await Venta.update(
          { serie_comprobante: serieGen, num_comprobante: numGen },
          { where: { idventa: ventaId }, transaction }
        );
      }
      // Insertar detalle y descontar stock
      for (const det of data.detalles) {
        await DetalleVenta.create({
          idventa: ventaId,
          idarticulo: det.idarticulo,
          cantidad: det.cantidad,
          precio_venta: det.precio_venta,
          descuento: det.descuento || 0
        } as any, { transaction });
        await ArticuloSucursal.update(
          { stock: sequelize.literal(`stock - ${det.cantidad}`) },
          { where: { idarticulo: det.idarticulo, idsucursal: sucursalActual }, transaction }
        );
      }
      // Si es Factura, guardar en sat_facturas dentro de la transacción
      if (data.tipo_comprobante === 'Factura' && dteResult?.dteData) {
        const rd = dteResult.dteData;
        const total = data.total_venta;
        let impuesto = 0;
        data.detalles.forEach(det => {
          const sub = (det.cantidad * det.precio_venta) - (det.descuento || 0);
          const erc = Math.round((sub / 1.12) * 10000) / 10000;
          impuesto += Math.round((erc * 12 / 100) * 10000) / 10000;
        });
        await SatFactura.create({
          idventa: ventaId,
          estado: 0,
          AcuseReciboSAT: rd.AcuseReciboSAT,
          autorizacion: rd.Autorizacion,
          serie: rd.Serie,
          numero: rd.NUMERO,
          fecha_dt: rd.Fecha_DTE,
          nit_eface: rd.NIT_EFACE,
          nombre_eface: rd.NOMBRE_EFACE,
          nit_comprador: rd.NIT_COMPRADOR,
          nombre_comprador: rd.NOMBRE_COMPRADOR,
          backprocesor: rd.BACKPROCESOR,
          fecha_certificacion: rd.Fecha_de_certificacion,
          ResponseDATA1: Buffer.from(rd.ResponseDATA1, 'base64').toString('utf-8'),
          ResponseDATA2: Buffer.from(rd.ResponseDATA2 || '', 'base64').toString('utf-8'),
          ResponseDATA3: `uploads/facturas/${rd.Autorizacion}.pdf`,
          total,
          impuesto: Math.round(impuesto * 100) / 100
        } as any, { transaction });
      }
      await transaction.commit();
      return {
        idventa: ventaId,
        serie: serieGen ?? undefined,
        num: numGen ?? undefined,
        html: dteHtml,
        pdfUrl: dtePdfUrl,
        autorizacion: dteAutorizacion
      };
    } catch (error: any) {
      await transaction.rollback();
      // Si el DTE ya se certificó en SAT pero la transacción falló, anularlo
      if (dteAutorizacion) {
        AuditService.registrar(username ?? null, 'DTE_ROLLBACK', 'venta', undefined,
          JSON.stringify({ autorizacion: dteAutorizacion, error: error.message, total: data.total_venta }), ip);
        try {
          await this.dteService.anularPorAutorizacion(
            dteAutorizacion,
            '44653948',
            data.total_venta,
            data.fecha_hora
          );
        } catch { /* ya se intentó */ }
      }
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  async cancel(id: number, motivo?: string, username?: string, ip?: string): Promise<{ ok: boolean }> {
    const transaction = await sequelize.transaction();
    try {
      const row = await Venta.findOne({
        where: { idventa: id, ...sucursalFilter(), ...selfFilter('idusuario') },
        include: [{ model: DetalleVenta, as: 'detalles' }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!row) throw new ApplicationException('Venta no encontrada', 404);
      const data = row.get() as any;
      if (data.estado === 'Anulado') {
        throw new ApplicationException('La venta ya está anulada');
      }
      // Revertir stock (sumar de vuelta) en sucursal activa
      const sucIdCancel = getSucursalId();
      if (data.detalles) {
        for (const det of data.detalles) {
          const detData = det.get ? det.get() : det;
          await ArticuloSucursal.update(
            { stock: sequelize.literal(`stock + ${detData.cantidad}`) },
            { where: { idarticulo: detData.idarticulo, idsucursal: sucIdCancel }, transaction }
          );
        }
      }
      // Anular DTE si es Factura
      if (data.tipo_comprobante === 'Factura') {
        try {
          await this.dteService.anular(id, motivo);
        } catch (dteError: any) {
          AuditService.registrar(username ?? null, 'DTE_CANCEL_ERROR', 'venta', id,
            JSON.stringify({ error: dteError.message, tipo: data.tipo_comprobante, total: data.total_venta }), ip);
          throw new ApplicationException('No se pudo anular la venta. Intente de nuevo más tarde.');
        }
      }
      await Venta.update(
        { estado: 'Anulado', motivo_anulacion: motivo || null },
        { where: { idventa: id }, transaction }
      );
      // Actualizar estado en sat_facturas
      await SatFactura.update(
        { estado: 1 },
        { where: { idventa: id }, transaction }
      );
      await transaction.commit();
      return { ok: true };
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException(error.message);
    }
  }
  private mapHeader(row: any): IVentaResponse {
    const d = row.get ? row.get() : row;
    return {
      idventa: d.idventa,
      idcliente: d.idcliente,
      cliente: d.cliente?.nombre,
      idusuario: d.idusuario,
      usuario: d.usuario?.nombre,
      tipo_comprobante: d.tipo_comprobante,
      tipo_venta: d.tipo_venta || 'CA',
      serie_comprobante: d.serie_comprobante || null,
      num_comprobante: d.num_comprobante || null,
      fecha_hora: d.fecha_hora,
      impuesto: parseFloat(d.impuesto) || 0,
      total_venta: parseFloat(d.total_venta) || 0,
      estado: d.estado,
      autorizacion: d.factura?.autorizacion,
      sucursal: d.sucursal?.nombre
    };
  }
  private mapDetail(row: any): IVentaResponse {
    const header = this.mapHeader(row);
    const d = row.get ? row.get() : row;
    const factura = d.factura?.get ? d.factura.get() : d.factura;
    return {
      ...header,
      cliente: d.cliente?.nombre,
      pdfUrl: factura?.ResponseDATA3 ? `/uploads/facturas/${factura.autorizacion}.pdf` : undefined,
      email: d.cliente?.email,
      direccion: d.cliente?.direccion,
      num_documento: d.cliente?.num_documento,
      detalles: (d.detalles || []).map((det: any) => {
        const dd = det.get ? det.get() : det;
        return {
          iddetalle_venta: dd.iddetalle_venta,
          idarticulo: dd.idarticulo,
          articulo: dd.articulo?.nombre,
          cantidad: dd.cantidad,
          precio_venta: parseFloat(dd.precio_venta) || 0,
          descuento: parseFloat(dd.descuento) || 0,
          subtotal: (dd.cantidad * parseFloat(dd.precio_venta)) - (parseFloat(dd.descuento) || 0)
        };
      })
    };
  }
}

