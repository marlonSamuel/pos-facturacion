import axios from 'axios';
import moment from 'moment';
import { ApplicationException } from '../common/errors/application.exception';
import { TokenDte, Venta, DetalleVenta, Person, SatFactura, Articulo, Sucursal } from '../models';
import type { IVentaResponse, IDetalleVentaResponse } from '../dtos/ISale';
import { getSucursalId } from '../common/request-context';
import { ApiRequestLogger } from './ApiRequestLogger';
interface SucursalDteConfig {
  nit: string;
  nombreEmisor: string;
  nombreComercial: string;
  direccionEmisor: string;
  codigoPostal: string;
  municipio: string;
  departamento: string;
  pais: string;
  codigoEstablecimiento: string;
  regimen: 'GEN' | 'PEQ';
  usuarioDigifact: string;
  usuarioLogin: string;
  passwordDigifact: string;
  authUrl: string;
  certUrl: string;
  cancelUrl: string;
}
export class DteService {
  /**
   * Construye la URL de certificación reemplazando {NIT} y {USERNAME} con los valores de la sucursal
   */
  private buildCertUrl(nit: string, username: string): string {
    const base = process.env.DTE_CERT_URL_BASE || '';
    return base.replace('{NIT}', encodeURIComponent(nit)).replace('{USERNAME}', encodeURIComponent(username));
  }
  /**
   * Construye la URL de anulación reemplazando {NIT} y {USERNAME} con los valores de la sucursal
   */
  private buildCancelUrl(nit: string, username: string): string {
    const base = process.env.DTE_CANCEL_URL_BASE || '';
    return base.replace('{NIT}', encodeURIComponent(nit)).replace('{USERNAME}', encodeURIComponent(username));
  }
  /**
   * Carga la configuración DTE desde la sucursal activa en BD + variables de entorno
   */
  private async getSucursalConfig(): Promise<SucursalDteConfig> {
    const sucId = getSucursalId();
    if (!sucId) throw new ApplicationException('No hay sucursal activa para configurar DTE');
    const suc = await Sucursal.findByPk(sucId);
    if (!suc) throw new ApplicationException('Sucursal no encontrada para DTE', 404);
    const d = suc.get() as any;
    const nit = d.nit || '';
    const usuarioDigifact = d.usuario_digifact || '';
    const usuarioLogin = d.usuario_login || '';
    const config: SucursalDteConfig = {
      nit,
      nombreEmisor: d.nombre_emisor || '',
      nombreComercial: d.nombre_comercial || '',
      direccionEmisor: d.direccion_emisor || '',
      codigoPostal: d.codigo_postal || '',
      municipio: d.municipio || '',
      departamento: d.departamento || '',
      pais: d.pais || '',
      codigoEstablecimiento: d.codigo_establecimiento || '',
      regimen: d.regimen || '',
      usuarioDigifact,
      usuarioLogin,
      passwordDigifact: d.password_digifact || '',
      authUrl: process.env.DTE_AUTH_URL || '',
      certUrl: this.buildCertUrl(nit, usuarioDigifact),
      cancelUrl: this.buildCancelUrl(nit, usuarioDigifact),
    };
    // Validar campos obligatorios
    if (!config.nit) throw new ApplicationException('NIT del emisor no configurado en la sucursal');
    if (!config.nombreEmisor) throw new ApplicationException('Nombre del emisor no configurado en la sucursal');
    if (!config.nombreComercial) throw new ApplicationException('Nombre comercial no configurado en la sucursal');
    if (!config.direccionEmisor) throw new ApplicationException('Dirección del emisor no configurada en la sucursal');
    if (!config.codigoPostal) throw new ApplicationException('Código postal no configurado en la sucursal');
    if (!config.municipio) throw new ApplicationException('Municipio no configurado en la sucursal');
    if (!config.departamento) throw new ApplicationException('Departamento no configurado en la sucursal');
    if (!config.pais) throw new ApplicationException('País no configurado en la sucursal');
    if (!config.codigoEstablecimiento) throw new ApplicationException('Código de establecimiento no configurado en la sucursal');
    if (!config.regimen) throw new ApplicationException('Régimen (GEN/PEQ) no configurado en la sucursal');
    if (!config.usuarioDigifact) throw new ApplicationException('Usuario Digifact no configurado en la sucursal');
    if (!config.usuarioLogin) throw new ApplicationException('Usuario login Digifact no configurado en la sucursal');
    if (!config.passwordDigifact) throw new ApplicationException('Password Digifact no configurado en la sucursal');
    if (!config.authUrl) throw new ApplicationException('URL de autenticación Digifact no configurada (DTE_AUTH_URL en .env)');
    if (!process.env.DTE_CERT_URL_BASE || !process.env.DTE_CERT_URL_BASE.includes('{NIT}')) throw new ApplicationException('URL de certificación Digifact no configurada (DTE_CERT_URL_BASE en .env)');
    if (!process.env.DTE_CANCEL_URL_BASE || !process.env.DTE_CANCEL_URL_BASE.includes('{NIT}')) throw new ApplicationException('URL de anulación Digifact no configurada (DTE_CANCEL_URL_BASE en .env)');
    return config;
  }
  /**
   * Obtiene token vÃ¡lido para la sucursal activa: usa cache en BD o login nuevo
   * Cada sucursal tiene su propio token por usuario (otorgado_a + idsucursal)
   */
  private async getToken(): Promise<string> {
    const config = await this.getSucursalConfig();
    const sucId = getSucursalId();
    if (sucId) {
      const ultimo = await TokenDte.findOne({
        where: { idsucursal: sucId, otorgado_a: config.usuarioLogin },
        order: [['id_token', 'DESC']]
      });
      if (ultimo) {
        const data = ultimo.get() as any;
        const expira = new Date(data.expira_en);
        const ahora = new Date();
        const diffMin = (expira.getTime() - ahora.getTime()) / 60000;
        if (diffMin >= 15) {
          return data.token;
        }
      }
    }
    return await this.login();
  }
  /**
   * Login al API DTE de SAT usando credenciales de la sucursal
   */
  private async login(): Promise<string> {
    const config = await this.getSucursalConfig();
    try {
      const resp = await axios.post(config.authUrl, {
        Username: config.usuarioLogin,
        Password: config.passwordDigifact
      }, { headers: { 'Content-Type': 'application/json' } });
      const data = resp.data;
      await TokenDte.create({
        idsucursal: getSucursalId() || null,
        token: data.Token,
        expira_en: data.expira_en,
        otorgado_a: data.otorgado_a
      } as any);
      ApiRequestLogger.log({
        idsucursal: getSucursalId() || undefined,
        endpoint: 'dte-auth',
        requestUrl: config.authUrl,
        requestBody: JSON.stringify({ Username: config.usuarioLogin, Password: '***' }),
        responseStatus: String(resp.status),
        responseBody: JSON.stringify({ Token: '***', expira_en: data.expira_en, otorgado_a: data.otorgado_a }),
        success: true
      });
      return data.Token;
    } catch (error: any) {
      const satMsg = error.response?.data?.Mensaje || error.message;
      ApiRequestLogger.log({
        idsucursal: getSucursalId() || undefined,
        endpoint: 'dte-auth',
        requestUrl: config.authUrl,
        requestBody: JSON.stringify({ Username: config.usuarioLogin, Password: '***' }),
        success: false,
        responseBody: satMsg
      });
      throw new ApplicationException(
        'No se pudo obtener token DTE: ' + satMsg
      );
    }
  }
  /**
   * Escapa valores para XML
   */
  private esc(s: any): string {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  /**
   * Formatea nÃÆÃÂºmero con decimales
   */
  private num(v: any, dec = 4): string {
    const n = parseFloat(v) || 0;
    return n.toFixed(dec);
  }
  /**
   * Genera el XML del DTE segÃÆÃÂºn el rÃÆÃÂ©gimen de la sucursal
   */
  private generarXML(venta: IVentaResponse, detalles: IDetalleVentaResponse[], config: SucursalDteConfig): string {
    return config.regimen === 'PEQ'
      ? this.generarXML_FPEQ(venta, detalles, config)
      : this.generarXML_FACT(venta, detalles, config);
  }
  /**
   * XML para FACT (RÃÆÃÂ©gimen General ÃÂ¢Ã¢âÂ¬Ã¢â¬Â 12% IVA desglosado)
   * Basado en inventarios/modelos/Dte12.php
   */
  private generarXML_FACT(venta: IVentaResponse, detalles: IDetalleVentaResponse[], config: SucursalDteConfig): string {
    const P = 'dte';
    const C = 'dtecomm';
    const fechaObj = new Date(venta.fecha_hora);
    const f = fechaObj.toISOString().split('T')[0];
    const h = fechaObj.toTimeString().split(' ')[0];
    let itemsXml = '';
    let granTotal = 0;
    let totalMontoImpuesto = 0;
    detalles.forEach((item, idx) => {
      const total = item.subtotal;
      granTotal += total;
      const erc = Math.round((total / 1.12) * 10000) / 10000;
      const iva = Math.round((erc * 12 / 100) * 10000) / 10000;
      totalMontoImpuesto += iva;
      itemsXml += `
         <${P}:Item NumeroLinea="${idx + 1}" BienOServicio="B">
            <${P}:Cantidad>${item.cantidad}</${P}:Cantidad>
            <${P}:UnidadMedida>11</${P}:UnidadMedida>
            <${P}:Descripcion>${this.esc(item.articulo)}</${P}:Descripcion>
            <${P}:PrecioUnitario>${this.num(item.precio_venta)}</${P}:PrecioUnitario>
            <${P}:Precio>${this.num(total + item.descuento)}</${P}:Precio>
            <${P}:Descuento>${this.num(item.descuento)}</${P}:Descuento>
            <${P}:Impuestos>
               <${P}:Impuesto>
                  <${P}:NombreCorto>IVA</${P}:NombreCorto>
                  <${P}:CodigoUnidadGravable>1</${P}:CodigoUnidadGravable>
                  <${P}:MontoGravable>${this.num(erc)}</${P}:MontoGravable>
                  <${P}:MontoImpuesto>${this.num(iva)}</${P}:MontoImpuesto>
               </${P}:Impuesto>
            </${P}:Impuestos>
            <${P}:Total>${this.num(total)}</${P}:Total>
         </${P}:Item>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>
<${P}:GTDocumento xmlns:${P}="http://www.sat.gob.gt/dte/fel/0.2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.1">
   <${P}:SAT ClaseDocumento="${P}">
      <${P}:DTE ID="DatosCertificados">
         <${P}:DatosEmision ID="DatosEmision">
            <${P}:DatosGenerales Tipo="FACT" FechaHoraEmision="${f}T${h}" CodigoMoneda="GTQ" />
            <${P}:Emisor NITEmisor="${config.nit}" NombreEmisor="${this.esc(config.nombreEmisor)}" CodigoEstablecimiento="${config.codigoEstablecimiento}" NombreComercial="${this.esc(config.nombreComercial)}" AfiliacionIVA="GEN">
               <${P}:DireccionEmisor>
                  <${P}:Direccion>${this.esc(config.direccionEmisor)}</${P}:Direccion>
                  <${P}:CodigoPostal>${this.esc(config.codigoPostal)}</${P}:CodigoPostal>
                  <${P}:Municipio>${this.esc(config.municipio)}</${P}:Municipio>
                  <${P}:Departamento>${this.esc(config.departamento)}</${P}:Departamento>
                  <${P}:Pais>${this.esc(config.pais)}</${P}:Pais>
               </${P}:DireccionEmisor>
            </${P}:Emisor>
            <${P}:Receptor NombreReceptor="${this.esc(venta.cliente || 'Consumidor Final')}" CorreoReceptor="${this.esc(venta.email || '')}" IDReceptor="${this.esc(venta.num_documento || 'CF')}">
               <${P}:DireccionReceptor>
                  <${P}:Direccion>${this.esc(venta.direccion || 'ciudad')}</${P}:Direccion>
                  <${P}:CodigoPostal>0</${P}:CodigoPostal>
                  <${P}:Municipio>Chiquimulilla</${P}:Municipio>
                  <${P}:Departamento>Santa Rosa</${P}:Departamento>
                  <${P}:Pais>GT</${P}:Pais>
               </${P}:DireccionReceptor>
            </${P}:Receptor>
            <${P}:Frases>
               <${P}:Frase TipoFrase="1" CodigoEscenario="1" />
            </${P}:Frases>
            <${P}:Items>
${itemsXml}
            </${P}:Items>
            <${P}:Totales>
               <${P}:TotalImpuestos>
                  <${P}:TotalImpuesto NombreCorto="IVA" TotalMontoImpuesto="${this.num(totalMontoImpuesto, 4)}" />
               </${P}:TotalImpuestos>
               <${P}:GranTotal>${this.num(granTotal)}</${P}:GranTotal>
            </${P}:Totales>
         </${P}:DatosEmision>
      </${P}:DTE>
      <${P}:Adenda>
         <${C}:Informacion_COMERCIAL xmlns:${C}="https://www.digifact.com.gt/dtecomm" xsi:schemaLocation="https://www.digifact.com.gt/dtecomm">
            <${C}:InformacionAdicional Version="2020_06_01">
               <${C}:REFERENCIA_INTERNA>PRE-${venta.idcliente}-${Date.now()}</${C}:REFERENCIA_INTERNA>
               <${C}:FECHA_REFERENCIA>${f}T${h}</${C}:FECHA_REFERENCIA>
               <${C}:VALIDAR_REFERENCIA_INTERNA>VALIDAR</${C}:VALIDAR_REFERENCIA_INTERNA>
            </${C}:InformacionAdicional>
         </${C}:Informacion_COMERCIAL>
      </${P}:Adenda>
   </${P}:SAT>
</${P}:GTDocumento>`;
  }
  /**
   * XML para FPEQ (PequeÃÆÃÂ±o Contribuyente ÃÂ¢Ã¢âÂ¬Ã¢â¬Â 5% IVA incluido, sin desglose)
   * Basado en inventarios/modelos/Dte.php
   */
  private generarXML_FPEQ(venta: IVentaResponse, detalles: IDetalleVentaResponse[], config: SucursalDteConfig): string {
    const P = 'dte';
    const C = 'dtecomm';
    const fechaObj = new Date(venta.fecha_hora);
    const f = fechaObj.toISOString().split('T')[0];
    const h = fechaObj.toTimeString().split(' ')[0];
    let itemsXml = '';
    let granTotal = 0;
    let totalMontoImpuesto = 0;
    detalles.forEach((item, idx) => {
      const total = item.subtotal;
      granTotal += total;
      // CÃÆÃÂ¡lculo interno (no se envÃÆÃÂ­a en XML, como en Dte.php legacy)
      const erc = Math.round((total / 1.05) * 10000) / 10000;
      const iva = Math.round((erc * 5 / 100) * 10000) / 10000;
      totalMontoImpuesto += iva;
      itemsXml += `
         <${P}:Item NumeroLinea="${idx + 1}" BienOServicio="B">
            <${P}:Cantidad>${item.cantidad}</${P}:Cantidad>
            <${P}:UnidadMedida>11</${P}:UnidadMedida>
            <${P}:Descripcion>${this.esc(item.articulo)}</${P}:Descripcion>
            <${P}:PrecioUnitario>${this.num(item.precio_venta)}</${P}:PrecioUnitario>
            <${P}:Precio>${this.num(total + item.descuento)}</${P}:Precio>
            <${P}:Descuento>${this.num(item.descuento)}</${P}:Descuento>
            <${P}:Total>${this.num(total)}</${P}:Total>
         </${P}:Item>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>
<${P}:GTDocumento xmlns:${P}="http://www.sat.gob.gt/dte/fel/0.2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.1">
   <${P}:SAT ClaseDocumento="${P}">
      <${P}:DTE ID="DatosCertificados">
         <${P}:DatosEmision ID="DatosEmision">
            <${P}:DatosGenerales Tipo="FPEQ" FechaHoraEmision="${f}T${h}" CodigoMoneda="GTQ" />
            <${P}:Emisor NITEmisor="${config.nit}" NombreEmisor="${this.esc(config.nombreEmisor)}" CodigoEstablecimiento="${config.codigoEstablecimiento}" NombreComercial="${this.esc(config.nombreComercial)}" AfiliacionIVA="PEQ">
               <${P}:DireccionEmisor>
                  <${P}:Direccion>${this.esc(config.direccionEmisor)}</${P}:Direccion>
                  <${P}:CodigoPostal>${this.esc(config.codigoPostal)}</${P}:CodigoPostal>
                  <${P}:Municipio>${this.esc(config.municipio)}</${P}:Municipio>
                  <${P}:Departamento>${this.esc(config.departamento)}</${P}:Departamento>
                  <${P}:Pais>${this.esc(config.pais)}</${P}:Pais>
               </${P}:DireccionEmisor>
            </${P}:Emisor>
            <${P}:Receptor NombreReceptor="${this.esc(venta.cliente || 'Consumidor Final')}" CorreoReceptor="${this.esc(venta.email || '')}" IDReceptor="${this.esc(venta.num_documento || 'CF')}">
               <${P}:DireccionReceptor>
                  <${P}:Direccion>${this.esc(venta.direccion || 'ciudad')}</${P}:Direccion>
                  <${P}:CodigoPostal>0</${P}:CodigoPostal>
                  <${P}:Municipio>Chiquimulilla</${P}:Municipio>
                  <${P}:Departamento>Santa Rosa</${P}:Departamento>
                  <${P}:Pais>GT</${P}:Pais>
               </${P}:DireccionReceptor>
            </${P}:Receptor>
            <${P}:Frases>
               <${P}:Frase TipoFrase="3" CodigoEscenario="1" />
            </${P}:Frases>
            <${P}:Items>
${itemsXml}
            </${P}:Items>
            <${P}:Totales>
               <${P}:GranTotal>${this.num(granTotal)}</${P}:GranTotal>
            </${P}:Totales>
         </${P}:DatosEmision>
      </${P}:DTE>
      <${P}:Adenda>
         <${C}:Informacion_COMERCIAL xmlns:${C}="https://www.digifact.com.gt/dtecomm" xsi:schemaLocation="https://www.digifact.com.gt/dtecomm">
            <${C}:InformacionAdicional Version="2020_06_01">
               <${C}:REFERENCIA_INTERNA>PRE-${venta.idcliente}-${Date.now()}</${C}:REFERENCIA_INTERNA>
               <${C}:FECHA_REFERENCIA>${f}T${h}</${C}:FECHA_REFERENCIA>
               <${C}:VALIDAR_REFERENCIA_INTERNA>VALIDAR</${C}:VALIDAR_REFERENCIA_INTERNA>
            </${C}:InformacionAdicional>
         </${C}:Informacion_COMERCIAL>
      </${P}:Adenda>
   </${P}:SAT>
</${P}:GTDocumento>`;
  }
  /**
   * Genera XML de anulaciÃÆÃÂ³n
   */
  private xmlCancel(dte: any, config: SucursalDteConfig, motivo?: string): string {
    const fechaHora = moment().format('YYYY-MM-DDTHH:mm:ss');
    const fechaCert = dte.fecha_certificacion ? moment(dte.fecha_certificacion).format('YYYY-MM-DDTHH:mm:ss') : fechaHora;
    const prefix = 'dte';
    const motivoEsc = this.esc(motivo || 'Anulación de documento autorizado por el administrador');
    return '<?xml version="1.0" encoding="UTF-8"?><' + prefix + ':GTAnulacionDocumento xmlns:' + prefix + '="http://www.sat.gob.gt/dte/fel/0.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.1"><' + prefix + ':SAT><' + prefix + ':AnulacionDTE ID="DatosCertificados"><' + prefix + ':DatosGenerales ID="DatosAnulacion" NumeroDocumentoAAnular="' + (dte.autorizacion || '') + '" NITEmisor="' + config.nit + '" IDReceptor="' + (dte.nit_comprador || '') + '" FechaEmisionDocumentoAnular="' + fechaCert + '" FechaHoraAnulacion="' + fechaHora + '" MotivoAnulacion="' + motivoEsc + '"/></' + prefix + ':AnulacionDTE></' + prefix + ':SAT></' + prefix + ':GTAnulacionDocumento>';
  }
  /**
   * Certifica un DTE ante SAT
   */
  async certificar(venta: IVentaResponse, detalles?: IDetalleVentaResponse[]): Promise<{
    serie: string;
    num: string;
    html: string;
    pdfUrl?: string;
    autorizacion: string;
    rpta: boolean;
    message: string;
    dteData?: any;
  }> {
    const config = await this.getSucursalConfig();
    const token = await this.getToken();
    try {
      if (!detalles) {
        const dRows = await DetalleVenta.findAll({
          where: { idventa: venta.idventa },
          include: [{ model: Articulo, as: 'articulo', attributes: ['nombre'] }]
        });
        detalles = dRows.map((d: any) => {
          const dd = d.get ? d.get() : d;
          return {
            iddetalle_venta: dd.iddetalle_venta,
            idarticulo: dd.idarticulo,
            articulo: dd.articulo?.nombre || '',
            cantidad: dd.cantidad,
            precio_venta: parseFloat(dd.precio_venta) || 0,
            descuento: parseFloat(dd.descuento) || 0,
            subtotal: (dd.cantidad * parseFloat(dd.precio_venta)) - (parseFloat(dd.descuento) || 0)
          };
        });
      }
      const detalleData = detalles;
      const xml = this.generarXML(venta, detalleData, config);
      const httpsMod = await import('https');
      const certUrl = new URL(config.certUrl);
      const responseData = await new Promise<any>((resolve, reject) => {
        const req = httpsMod.request(certUrl, {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json charset=UTF8',
            'Content-Length': Buffer.byteLength(xml, 'utf-8')
          }
        }, (res) => {
          let data = '';
          res.on('data', (c) => data += c);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { reject(new Error('Respuesta SAT: ' + data)); }
          });
        });
        req.on('error', reject);
        req.write(xml, 'utf-8');
        req.end();
      });
      const success = responseData.Codigo === 1;
      ApiRequestLogger.log({
        idsucursal: getSucursalId() || undefined,
        endpoint: 'dte-certify',
        requestUrl: config.certUrl,
        requestBody: xml,
        responseStatus: String(responseData.Codigo),
        responseBody: JSON.stringify(responseData).slice(0, 5000),
        success
      });
      if (!success) {
        return {
          message: 'No se pudo certificar: ' + (responseData.Mensaje || 'Error SAT'),
          serie: '', num: '', html: '', autorizacion: '', rpta: false
        };
      }
      const pdfPath = `uploads/facturas/${responseData.Autorizacion}.pdf`;
      const fs = await import('fs');
      const path = await import('path');
      const fullPath = path.join(__dirname, '../../', pdfPath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, Buffer.from(responseData.ResponseDATA3, 'base64'));
      return {
        message: 'Factura registrada correctamente',
        serie: responseData.Serie,
        num: responseData.NUMERO,
        html: Buffer.from(responseData.ResponseDATA2 || '', 'base64').toString('utf-8'),
        pdfUrl: `/uploads/facturas/${responseData.Autorizacion}.pdf`,
        autorizacion: responseData.Autorizacion,
        rpta: true,
        dteData: responseData
      };
    } catch (error: any) {
      const satMsg = error.response?.data?.Mensaje || error.message;
      const satDetail = error.response?.data ? JSON.stringify(error.response.data).slice(0, 500) : '';
      ApiRequestLogger.log({
        idsucursal: getSucursalId() || undefined,
        endpoint: 'dte-certify',
        success: false,
        responseBody: satMsg + satDetail
      });
      throw new ApplicationException(
        `Error al certificar DTE: ${satMsg}${satDetail ? ' | Detail: ' + satDetail : ''}`
      );
    }
  }
  /**
   * Anula un DTE ante SAT (por autorizacion)
   */
  async anularPorAutorizacion(autorizacion: string, nit: string, total: number, fecha: string, motivo?: string): Promise<void> {
    const config = await this.getSucursalConfig();
    const token = await this.getToken();
    const motivoEsc = this.esc(motivo || 'Error en transaccion interna');
    const xml = '<?xml version="1.0" encoding="UTF-8"?><dte:GTAnulacionDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.1.0" Version="0.1"><dte:SAT><dte:AnulacionDTE ID="DatosCertificados"><dte:DatosGenerales NumeroDocumento="' + autorizacion + '" FechaEmisionDocumentoAnular="' + fecha + '" TotalDocumentoAnular="' + total.toFixed(4) + '" MotivoAnulacion="' + motivoEsc + '"/><dte:Emisor NITEmisor="' + config.nit + '"/></dte:AnulacionDTE></dte:SAT></dte:GTAnulacionDocumento>';
    try {
      const resp = await axios.post(config.cancelUrl, xml, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json charset=UTF8'
        },
        timeout: 15000
      });
      ApiRequestLogger.log({
        idsucursal: getSucursalId() || undefined,
        endpoint: 'dte-cancel',
        requestUrl: config.cancelUrl,
        requestBody: xml,
        responseStatus: String(resp.status),
        responseBody: JSON.stringify(resp.data).slice(0, 5000),
        success: true
      });
    } catch (err: any) {
      ApiRequestLogger.log({
        idsucursal: getSucursalId() || undefined,
        endpoint: 'dte-cancel',
        requestUrl: config?.cancelUrl,
        requestBody: xml,
        success: false,
        responseStatus: String(err.response?.status || ''),
        responseBody: JSON.stringify(err.response?.data || err.message).slice(0, 5000)
      });
      console.warn(`No se pudo anular DTE ${autorizacion} en SAT`);
    }
  }
  /**
   * Anula un DTE ante SAT (por id de venta)
   */
  async anular(idventa: number, motivo?: string): Promise<void> {
    const factura = await SatFactura.findOne({ where: { idventa } });
    if (!factura) {
      throw new ApplicationException('No se encontro factura DTE para esta venta', 404);
    }
    const config = await this.getSucursalConfig();
    const dte = factura.get() as any;
    const token = await this.getToken();
    const xml = this.xmlCancel(dte, config, motivo);
    try {
      const httpsMod = await import('https');
      const cancelUrl = new URL(config.cancelUrl);
      const responseData = await new Promise<any>((resolve, reject) => {
        const req = httpsMod.request(cancelUrl, {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json charset=UTF8',
            'Content-Length': Buffer.byteLength(xml, 'utf-8')
          }
        }, (res) => {
          let data = '';
          res.on('data', (c) => data += c);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { reject(new Error('Respuesta SAT: ' + data)); }
          });
        });
        req.on('error', reject);
        req.write(xml, 'utf-8');
        req.end();
      });
      ApiRequestLogger.log({
        idsucursal: getSucursalId() || undefined,
        endpoint: 'dte-cancel',
        requestUrl: config.cancelUrl,
        requestBody: xml,
        responseStatus: String(responseData.Codigo),
        responseBody: JSON.stringify(responseData).slice(0, 5000),
        success: responseData.Codigo === 1
      });
      if (responseData.Codigo !== 1) {
        throw new ApplicationException('No se pudo anular factura: ' + (responseData.Mensaje || 'Error SAT'));
      }
      await SatFactura.update({ estado: 1 }, { where: { idventa } });
    } catch (error: any) {
      if (error instanceof ApplicationException) throw error;
      ApiRequestLogger.log({
        idsucursal: getSucursalId() || undefined,
        endpoint: 'dte-cancel',
        requestUrl: config?.cancelUrl,
        requestBody: xml,
        success: false,
        responseStatus: String(error.response?.status || ''),
        responseBody: JSON.stringify(error.response?.data || error.message).slice(0, 5000)
      });
      throw new ApplicationException('Error al anular DTE: ' + (error.response?.data?.Mensaje || error.message));
    }
  }
}
