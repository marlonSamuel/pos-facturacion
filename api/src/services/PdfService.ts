import PDFDocument from 'pdfkit';
import { ApplicationException } from '../common/errors/application.exception';
import { Venta, Person, DetalleVenta, Articulo } from '../models';
export class PdfService {
  async generateDocument(ventaId: number): Promise<Buffer> {
    const venta = await Venta.findByPk(ventaId, {
      include: [
        { model: Person, as: 'cliente', attributes: ['nombre', 'tipo_documento', 'num_documento', 'direccion', 'telefono', 'email'] },
        {
          model: DetalleVenta, as: 'detalles',
          include: [{ model: Articulo, as: 'articulo', attributes: ['nombre', 'codigo'] }]
        }
      ]
    });
    if (!venta) throw new ApplicationException('Venta no encontrada', 404);
    const d = venta.get() as any;
    const cliente = d.cliente || {};
    const detalles = d.detalles || [];
    const doc = new PDFDocument({ size: 'A4', margin: 20, info: { Title: `${d.tipo_comprobante || 'Documento'} ${d.serie_comprobante || ''}${d.num_comprobante || ''}` } });
    const bufs: Buffer[] = [];
    doc.on('data', (c: Buffer) => bufs.push(c));
    const COLOR = '#0f172a';
    const ACCENT = '#64d2d6';
    const ML = 30;
    const PW = doc.page.width;     // 595.28
    const PH = doc.page.height;    // 841.89
    const UW = PW - 60;            // 535.28
    const MR = PW - 30;
    const BORDER = '#1f2937';
    let y = 25;
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    // ENCABEZADO
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    doc.rect(ML, y + 2, 38, 38).fill('#000');
    doc.fillColor(COLOR);
    doc.fontSize(14).font('Helvetica-Bold').text('NEW HORIZON', ML + 46, y);
    doc.fontSize(9).font('Helvetica');
    doc.text('269837446578', ML + 46, y + 16);
    doc.text('DirecciÃƒÂ³n: Chiquimulilla, Santa Rosa', ML + 46, y + 25);
    doc.text('TelÃƒÂ©fono: 55774465', ML + 46, y + 34);
    doc.text('Email: newhorizon@gmail.com', ML + 46, y + 43);
    const pillW = 170;
    const pillX = MR - pillW;
    doc.roundedRect(pillX, y, pillW, 22, 11).fillOpacity(0.25).fill(ACCENT).fillOpacity(1);
    doc.roundedRect(pillX, y, pillW, 22, 11).lineWidth(0.5).stroke('#0d9488');
    doc.fillColor(COLOR).fontSize(12).font('Helvetica-Bold');
    doc.text(`${d.tipo_comprobante || 'Documento'} ${d.serie_comprobante || ''}-${d.num_comprobante || d.idventa}`,
      pillX, y + 4, { width: pillW, align: 'center' });
    const dateW = 140;
    const dateX = MR - dateW;
    const dateY = y + 28;
    doc.roundedRect(dateX, dateY, dateW, 28, 2).lineWidth(0.5).stroke('#9ca3af');
    doc.roundedRect(dateX, dateY, dateW, 10, 2).fill('#f9fafb');
    doc.lineWidth(0.5).moveTo(dateX, dateY + 10).lineTo(dateX + dateW, dateY + 10).stroke('#9ca3af');
    doc.fillColor(COLOR).fontSize(7).font('Helvetica-Bold');
    doc.text('FECHA', dateX, dateY + 1, { width: dateW, align: 'center' });
    const fecha = new Date(d.fecha_hora).toLocaleDateString('es-GT', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    doc.fillColor(COLOR).fontSize(9).font('Helvetica');
    doc.text(fecha, dateX, dateY + 12, { width: dateW, align: 'center' });
    y = Math.max(y + 52, dateY + 36);
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    // CLIENTE
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    y += 6;
    doc.fillColor(COLOR).fontSize(9).font('Helvetica-Bold');
    doc.text('CLIENTE', ML, y);
    y += 12;
    doc.fontSize(10).font('Helvetica');
    doc.font('Helvetica-Bold').text(cliente.nombre || 'Consumidor Final', ML, y);
    y += 12;
    doc.font('Helvetica');
    if (cliente.direccion) { doc.text(`Domicilio: ${cliente.direccion}`, ML, y); y += 12; }
    doc.text(`NIT: ${cliente.num_documento || 'CF'}`, ML, y); y += 12;
    if (cliente.email) { doc.text(`Email: ${cliente.email}`, ML, y); y += 12; }
    if (cliente.telefono) { doc.text(`TelÃƒÂ©fono: ${cliente.telefono}`, ML, y); y += 12; }
    y += 6;
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    // TABLA DE ARTÃƒÂCULOS Ã¢â‚¬â€ se estira hasta el fondo de la hoja
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    const cols = [
      { label: 'Codigo',    x: ML,       w: 80  },
      { label: 'Descripcion', x: ML + 80, w: 195 },
      { label: 'Cantidad',  x: ML + 275, w: 50  },
      { label: 'P.U.',      x: ML + 325, w: 68  },
      { label: 'Dscto',     x: ML + 393, w: 68  },
      { label: 'Subtotal',  x: ML + 461, w: 74.28 },
    ];
    const rowH = 16;
    const headerH = 18;
    // Calcular espacio disponible: dejar abajo para footer (52) + sig (42) + gaps
    const bottomReserve = 10 + 56 + 10 + 44 + 30; // = 150
    const tableEndY = PH - bottomReserve;
    const tableH = Math.max(
      headerH + Math.max(detalles.length, 1) * rowH + 2,
      tableEndY - y
    );
    // Outer rect
    doc.roundedRect(ML, y, UW, tableH, 2).lineWidth(0.5).stroke(BORDER);
    // Vertical separators
    doc.lineWidth(0.5);
    for (let i = 1; i < cols.length; i++) {
      doc.moveTo(cols[i].x, y).lineTo(cols[i].x, y + tableH).stroke(BORDER);
    }
    // Header bottom border
    doc.moveTo(ML, y + headerH).lineTo(ML + UW, y + headerH).stroke(BORDER);
    // Header text
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLOR);
    for (const c of cols) {
      doc.text(c.label, c.x, y + 4, { width: c.w, align: 'center' });
    }
    // Data rows
    doc.fontSize(9).font('Helvetica');
    for (let i = 0; i < detalles.length; i++) {
      const ry = y + headerH + 2 + i * rowH;
      const det = detalles[i];
      const dd = det.get ? det.get() : det;
      const art = dd.articulo || {};
      const precio = parseFloat(dd.precio_venta) || 0;
      const cant = dd.cantidad || 0;
      const desc = parseFloat(dd.descuento) || 0;
      const sub = (cant * precio) - desc;
      doc.text(art.codigo || '', ML, ry,        { width: 80,  align: 'center' });
      doc.text(art.nombre || '', ML + 80, ry,   { width: 195, align: 'center' });
      doc.text(String(cant), ML + 275, ry,      { width: 50,  align: 'center' });
      doc.text(`Q${precio.toFixed(2)}`, ML + 325, ry, { width: 68,  align: 'center' });
      doc.text(desc > 0 ? `Q${desc.toFixed(2)}` : '-', ML + 393, ry,   { width: 68,  align: 'center' });
      doc.text(`Q${sub.toFixed(2)}`, ML + 461, ry,    { width: 74.28, align: 'center' });
    }
    y += tableH + 10;
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    // FOOTER Ã¢â‚¬â€ Importe Total con Letra (izq) + Totales (der, alineado a la derecha)
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    const totalVenta = parseFloat(d.total_venta) || 0;
    const letras = this.numeroEnLetras(totalVenta);
    const boxH = 56;
    const boxGap = 8;
    const rightBoxW = UW * 0.38;         // ~203
    const rbx = MR - rightBoxW;          // alineado al borde derecho de la tabla
    const leftBoxW = rbx - ML - boxGap;  // lo que sobra a la izquierda
    // --- Izquierda: Importe Total con Letra ---
    doc.roundedRect(ML, y, leftBoxW, boxH, 2).lineWidth(0.5).stroke(BORDER);
    doc.fillColor(COLOR).fontSize(8).font('Helvetica-Bold');
    doc.text('Importe Total con Letra', ML + 4, y + 3);
    doc.fontSize(9).font('Helvetica');
    doc.text(letras, ML + 4, y + 14, { width: leftBoxW - 8 });
    // --- Derecha: Totales (alineado a MR) ---
    doc.roundedRect(rbx, y, rightBoxW, boxH, 2).lineWidth(0.5).stroke(BORDER);
    doc.roundedRect(rbx, y, rightBoxW, 15, 2).fill('#f9fafb');
    doc.lineWidth(0.5).moveTo(rbx, y + 15).lineTo(rbx + rightBoxW, y + 15).stroke(BORDER);
    doc.fillColor(COLOR).fontSize(8).font('Helvetica-Bold');
    doc.text('Totales', rbx, y + 3, { width: rightBoxW, align: 'center' });
    const innerW = rightBoxW * 0.35;
    doc.lineWidth(0.5).moveTo(rbx + innerW, y + 15).lineTo(rbx + innerW, y + boxH).stroke(BORDER);
    doc.fillColor(COLOR).fontSize(8).font('Helvetica-Bold');
    doc.text('Total a Pagar', rbx + 2, y + 18, { width: innerW - 4 });
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Q ${totalVenta.toFixed(2)}`, rbx + innerW + 2, y + 18, { width: rightBoxW - innerW - 4, align: 'right' });
    y += boxH + 10;
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    // FIRMA
    // Ã¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·ÂÃ¢·Â
    const sigW = UW * 0.6;
    const sigX = ML + (UW - sigW) / 2;
    doc.roundedRect(sigX, y, sigW, 42, 2).lineWidth(0.5).stroke(BORDER);
    doc.lineWidth(0.5).moveTo(sigX + 20, y + 22).lineTo(sigX + sigW - 20, y + 22).stroke(BORDER);
    doc.fillColor(COLOR).fontSize(11).font('Helvetica-Bold');
    doc.text('RecibÃƒÂ­ Conforme', sigX, y + 23, { width: sigW, align: 'center' });
    doc.end();
    return new Promise(r => doc.on('end', () => r(Buffer.concat(bufs))));
  }
  private numeroEnLetras(num: number): string {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
      'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÃƒâ€°IS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    const entero = Math.floor(num);
    const decimal = Math.round((num - entero) * 100);
    const convertir = (n: number): string => {
      if (n === 0) return 'CERO';
      if (n < 20) return unidades[n];
      if (n < 100) {
        const d = Math.floor(n / 10);
        const u = n % 10;
        if (d === 2 && u > 0) return `VEINTI${unidades[u]}`;
        return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`;
      }
      if (n < 1000) {
        const c = Math.floor(n / 100);
        const r = n % 100;
        if (n === 100) return 'CIEN';
        return r === 0 ? centenas[c] : `${centenas[c]} ${convertir(r)}`;
      }
      if (n < 1000000) {
        const m = Math.floor(n / 1000);
        const r = n % 1000;
        const prefix = m === 1 ? 'MIL' : `${convertir(m)} MIL`;
        return r === 0 ? prefix : `${prefix} ${convertir(r)}`;
      }
      return num.toFixed(2);
    };
    const enteroStr = entero === 0 ? 'CERO' : convertir(entero);
    return `${enteroStr} ${decimal > 0 ? `CON ${decimal.toString().padStart(2, '0')}/100` : '00/100'} NUEVOS QUETZALES`;
  }
}
