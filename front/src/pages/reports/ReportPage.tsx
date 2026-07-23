import { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Tag, Select, Button, DatePicker, Row, Col } from 'antd';
import {
  ShoppingCartOutlined, ShoppingOutlined, FileTextOutlined,
  BarChartOutlined, WarningOutlined, RiseOutlined, InboxOutlined,
  PieChartOutlined, TableOutlined,
} from '@ant-design/icons';
import { useReport } from '../../hooks/useReport';
import { usePersonas } from '../../hooks/usePersonas';
import { useCategory } from '../../hooks/useCategory';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { ReportTable } from '../../components/reports/ReportTable';
import { ReportExport } from '../../components/reports/ReportExport';
import { ReportCharts } from '../../components/reports/ReportCharts';

const { Title, Text } = Typography;
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function buildExportUrl(type: string, format: 'pdf' | 'xlsx', params: Record<string, any>) {
  const qs = Object.entries({ ...params, format })
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${API_BASE}/reports/export/${type}?${qs}`;
}

async function exportFile(url: string, format: 'pdf' | 'xlsx') {
  const token = localStorage.getItem('token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Export error:', res.status, errText);
    return;
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  if (format === 'pdf') {
    window.open(blobUrl, '_blank');
  } else {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `reporte-${Date.now()}.xlsx`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

const ReportPage = () => {
  const [tab, setTab] = useState<string>('sales');

  return (
    <div style={{ padding: '0 4px' }}>
      <Title level={4} style={{ marginBottom: 16 }}>Reportes</Title>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        type="card"
        size="small"
        items={[
          { key: 'sales',     label: 'Ventas',         icon: <ShoppingCartOutlined />, children: <SalesReport /> },
          { key: 'purchases', label: 'Compras',        icon: <ShoppingOutlined />,     children: <PurchasesReport /> },
          { key: 'dte',       label: 'Facturas DTE',   icon: <FileTextOutlined />,     children: <DteReport /> },
          { key: 'vs',        label: 'Ctas vs Vtas',   icon: <BarChartOutlined />,     children: <VsReport /> },
          { key: 'stock',     label: 'Stock Mínimo',   icon: <WarningOutlined />,      children: <StockReport /> },
          { key: 'top',       label: 'Más Vendidos',   icon: <RiseOutlined />,         children: <TopProductsReport /> },
          { key: 'inventory', label: 'Inventario',     icon: <InboxOutlined />,        children: <InventoryReport /> },
          { key: 'full',      label: 'Resumen',        icon: <PieChartOutlined />,     children: <ComprehensiveReport /> },
        ]}
      />
    </div>
  );
};

/* ─── Ventas ─── */
const SalesReport = () => {
  const r = useReport<any>('sales');
  const clientes = usePersonas('Cliente');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const search = (f: any) => {
    const p = { from: f.from || '2000-01-01', to: f.to || '2100-12-31', cliente: f.cliente, tipo: f.tipo, estado: f.estado || 'Aceptado' };
    setFilters(p);
    r.fetch(p);
  };
  useEffect(() => { search({}); }, []);

  const onExportPdf = () => exportFile(buildExportUrl('sales', 'pdf', { ...filters, from: filters.from || '2000-01-01', to: filters.to || '2100-12-31' }), 'pdf');
  const onExportExcel = () => exportFile(buildExportUrl('sales', 'xlsx', { ...filters, from: filters.from || '2000-01-01', to: filters.to || '2100-12-31' }), 'xlsx');

  const cols = [
    { title: 'Fecha', dataIndex: 'fecha_hora', key: 'f', width: 100, sorter: (a: any, b: any) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(), render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Tipo', dataIndex: 'tipo_comprobante', key: 't', width: 80, sorter: (a: any, b: any) => a.tipo_comprobante.localeCompare(b.tipo_comprobante), render: (v: string) => <Tag color={v === 'Factura' ? 'purple' : v === 'Ticket' ? 'blue' : 'cyan'}>{v}</Tag> },
    { title: 'Documento', key: 'd', sorter: (a: any, b: any) => (`${a.serie_comprobante || ''}${a.num_comprobante || ''}`).localeCompare(`${b.serie_comprobante || ''}${b.num_comprobante || ''}`), render: (_: any, row: any) => `${row.serie_comprobante || ''}${row.num_comprobante || ''}` },
    { title: 'Cliente', dataIndex: 'cliente', key: 'c', sorter: (a: any, b: any) => (a.cliente || '').localeCompare(b.cliente || '') },
    { title: 'Total', dataIndex: 'total_venta', key: 'tv', width: 100, align: 'right' as const, sorter: (a: any, b: any) => a.total_venta - b.total_venta, render: (v: number) => `Q${Number(v).toFixed(2)}` },
    { title: 'Estado', dataIndex: 'estado', key: 'est', width: 90, sorter: (a: any, b: any) => (a.estado || '').localeCompare(b.estado || ''), render: (v: string) => <Tag color={v === 'Aceptado' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Motivo', dataIndex: 'motivo_anulacion', key: 'mot', width: 120, render: (v: string) => v || '-' },
    { title: 'Usuario', dataIndex: 'usuario', key: 'u', width: 100, sorter: (a: any, b: any) => (a.usuario || '').localeCompare(b.usuario || '') },
  ];

  return (
    <Card size="small" title={<><ShoppingCartOutlined /> Reporte de Ventas</>} styles={{ body: { padding: 12 } }}>
      <ReportFilters showDate showType showEstado showClient clients={clientes.map(c => ({ value: c.idpersona, label: c.nombre }))} onSearch={search} />
      <div style={{ textAlign: 'left', marginBottom: 8 }}><ReportExport onExportPdf={onExportPdf} onExportExcel={onExportExcel} /></div>
      <ReportTable columns={cols} data={r.data?.rows || []} rowKey="idventa" loading={r.loading}
        footerContent={<Text strong>Total: Q{Number(r.data?.total || 0).toFixed(2)} ({r.data?.count || 0} registros)</Text>} />
    </Card>
  );
};

/* ─── Compras ─── */
const PurchasesReport = () => {
  const r = useReport<any>('purchases');
  const proveedores = usePersonas('Proveedor');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const search = (f: any) => {
    const p = { from: f.from || '2000-01-01', to: f.to || '2100-12-31', proveedor: f.proveedor, estado: f.estado || 'Aceptado' };
    setFilters(p);
    r.fetch(p);
  };
  useEffect(() => { search({}); }, []);

  const onExportPdf = () => exportFile(buildExportUrl('purchases', 'pdf', { ...filters, from: filters.from || '2000-01-01', to: filters.to || '2100-12-31' }), 'pdf');
  const onExportExcel = () => exportFile(buildExportUrl('purchases', 'xlsx', { ...filters, from: filters.from || '2000-01-01', to: filters.to || '2100-12-31' }), 'xlsx');

  const cols = [
    { title: 'Fecha', dataIndex: 'fecha_hora', key: 'f', width: 100, sorter: (a: any, b: any) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(), render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Tipo', dataIndex: 'tipo_comprobante', key: 't', width: 80, sorter: (a: any, b: any) => (a.tipo_comprobante || '').localeCompare(b.tipo_comprobante || '') },
    { title: 'Documento', key: 'd', sorter: (a: any, b: any) => (`${a.serie_comprobante || ''}${a.num_comprobante || ''}`).localeCompare(`${b.serie_comprobante || ''}${b.num_comprobante || ''}`), render: (_: any, row: any) => `${row.serie_comprobante || ''}${row.num_comprobante || ''}` },
    { title: 'Proveedor', dataIndex: 'proveedor', key: 'p', sorter: (a: any, b: any) => (a.proveedor || '').localeCompare(b.proveedor || '') },
    { title: 'Total', dataIndex: 'total_compra', key: 'tc', width: 100, align: 'right' as const, sorter: (a: any, b: any) => a.total_compra - b.total_compra, render: (v: number) => `Q${Number(v).toFixed(2)}` },
    { title: 'Estado', dataIndex: 'estado', key: 'est', width: 90, sorter: (a: any, b: any) => (a.estado || '').localeCompare(b.estado || ''), render: (v: string) => <Tag color={v === 'Aceptado' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Motivo', dataIndex: 'motivo_anulacion', key: 'mot', width: 120, render: (v: string) => v || '-' },
  ];

  return (
    <Card size="small" title={<><ShoppingOutlined /> Reporte de Compras</>} styles={{ body: { padding: 12 } }}>
      <ReportFilters showDate showEstado showProvider providers={proveedores.map(c => ({ value: c.idpersona, label: c.nombre }))} onSearch={search} />
      <div style={{ textAlign: 'left', marginBottom: 8 }}><ReportExport onExportPdf={onExportPdf} onExportExcel={onExportExcel} /></div>
      <ReportTable columns={cols} data={r.data?.rows || []} rowKey="idingreso" loading={r.loading}
        footerContent={<Text strong>Total: Q{Number(r.data?.total || 0).toFixed(2)} ({r.data?.count || 0} registros)</Text>} />
    </Card>
  );
};

/* ─── DTE ─── */
const DteReport = () => {
  const r = useReport<any>('dte-invoices');
  const clientes = usePersonas('Cliente');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const search = (f: any) => {
    const p = { from: f.from || '2000-01-01', to: f.to || '2100-12-31', cliente: f.cliente, estado: f.estado || 'Aceptado' };
    setFilters(p);
    r.fetch(p);
  };
  useEffect(() => { search({}); }, []);

  const onExportPdf = () => exportFile(buildExportUrl('dte-invoices', 'pdf', { ...filters, from: filters.from || '2000-01-01', to: filters.to || '2100-12-31' }), 'pdf');
  const onExportExcel = () => exportFile(buildExportUrl('dte-invoices', 'xlsx', { ...filters, from: filters.from || '2000-01-01', to: filters.to || '2100-12-31' }), 'xlsx');

  const cols = [
    { title: 'Autorización', dataIndex: 'autorizacion', key: 'a', sorter: (a: any, b: any) => (a.autorizacion || '').localeCompare(b.autorizacion || '') },
    { title: 'Serie', dataIndex: 'serie', key: 's', width: 60, sorter: (a: any, b: any) => (a.serie || '').localeCompare(b.serie || '') },
    { title: 'No.', dataIndex: 'numero', key: 'n', width: 60, sorter: (a: any, b: any) => (a.numero || '').localeCompare(b.numero || '') },
    { title: 'NIT', dataIndex: 'nit_comprador', key: 'nit', sorter: (a: any, b: any) => (a.nit_comprador || '').localeCompare(b.nit_comprador || '') },
    { title: 'Comprador', dataIndex: 'nombre_comprador', key: 'nom', sorter: (a: any, b: any) => (a.nombre_comprador || '').localeCompare(b.nombre_comprador || '') },
    { title: 'Total', dataIndex: 'total', key: 't', width: 100, align: 'right' as const, sorter: (a: any, b: any) => a.total - b.total, render: (v: number) => `Q${Number(v).toFixed(2)}` },
    { title: 'IVA', dataIndex: 'impuesto', key: 'i', width: 80, align: 'right' as const, sorter: (a: any, b: any) => a.impuesto - b.impuesto, render: (v: number) => `Q${Number(v).toFixed(2)}` },
    { title: 'Estado', dataIndex: 'estado_dte', key: 'est', width: 80, render: (v: number) => <Tag color={v === 0 ? 'green' : 'red'}>{v === 0 ? 'Activa' : 'Anulada'}</Tag> },
    { title: 'Motivo', dataIndex: 'motivo_anulacion', key: 'mot', width: 120, render: (v: string) => v || '-' },
    { title: 'Fecha Cert.', dataIndex: 'fecha_certificacion', key: 'fc', width: 100, sorter: (a: any, b: any) => new Date(a.fecha_certificacion).getTime() - new Date(b.fecha_certificacion).getTime(), render: (v: string) => v ? new Date(v).toLocaleDateString() : '' },
  ];

  return (
    <Card size="small" title={<><FileTextOutlined /> Facturas DTE</>} styles={{ body: { padding: 12 } }}>
      <ReportFilters showDate showEstado showClient clients={clientes.map(c => ({ value: c.idpersona, label: c.nombre }))} onSearch={search} />
      <div style={{ textAlign: 'left', marginBottom: 8 }}><ReportExport onExportPdf={onExportPdf} onExportExcel={onExportExcel} /></div>
      <ReportTable columns={cols} data={r.data?.rows || []} rowKey="idfactura" loading={r.loading}
        footerContent={<Text strong>Total: Q{Number(r.data?.total || 0).toFixed(2)} | IVA: Q{Number(r.data?.impuesto || 0).toFixed(2)} ({r.data?.count || 0} facturas)</Text>} />
    </Card>
  );
};

/* ─── Compras vs Ventas ─── */
const VsReport = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const r = useReport<any>(`purchases-vs-sales/${year}`);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const search = (f: any) => {
    const p = { year: f.year || year };
    setFilters(p);
    if (f.year) setYear(f.year);
    r.fetch();
  };
  useEffect(() => { search({}); }, [year]);

  const onExportPdf = () => exportFile(buildExportUrl('purchases-vs-sales', 'pdf', { ...filters, year: filters.year || year }), 'pdf');
  const onExportExcel = () => exportFile(buildExportUrl('purchases-vs-sales', 'xlsx', { ...filters, year: filters.year || year }), 'xlsx');

  const data = r.data?.rows || [];
  const cols = [
    { title: 'Mes', key: 'm', width: 60, render: (_: any, __: any, i: number) => MONTHS[i] },
    { title: 'Ventas', dataIndex: 'total_venta', key: 'v', align: 'right' as const, sorter: (a: any, b: any) => a.total_venta - b.total_venta, render: (v: number) => `Q${Number(v).toFixed(2)}` },
    { title: 'Compras', dataIndex: 'total_compra', key: 'c', align: 'right' as const, sorter: (a: any, b: any) => a.total_compra - b.total_compra, render: (v: number) => `Q${Number(v).toFixed(2)}` },
    { title: 'Diferencia', key: 'd', align: 'right' as const, sorter: (a: any, b: any) => (a.total_venta - a.total_compra) - (b.total_venta - b.total_compra), render: (_: any, row: any) => {
      const dif = parseFloat(row.total_venta || 0) - parseFloat(row.total_compra || 0);
      return <Text style={{ color: dif >= 0 ? '#52c41a' : '#ff4d4f' }}>Q{dif.toFixed(2)}</Text>;
    }},
  ];

  return (
    <Card size="small" title={<><BarChartOutlined /> Compras vs Ventas</>} styles={{ body: { padding: 12 } }}>
      <ReportFilters showYear onSearch={search} />
      <div style={{ textAlign: 'left', marginBottom: 8 }}><ReportExport onExportPdf={onExportPdf} onExportExcel={onExportExcel} /></div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ width: '60%', verticalAlign: 'top', paddingRight: 12 }}>
              <ReportTable columns={cols} data={data} rowKey="mes" loading={r.loading}
                footerContent={<Text strong>Ventas: Q{Number(r.data?.totalVentas || 0).toFixed(2)} | Compras: Q{Number(r.data?.totalCompras || 0).toFixed(2)}</Text>} />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <ReportCharts data={data} height={300}
                bars={[
                  { dataKey: 'total_venta', name: 'Ventas', color: '#1890ff' },
                  { dataKey: 'total_compra', name: 'Compras', color: '#52c41a' },
                ]} />
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
};

/* ─── Stock Mínimo ─── */
const StockReport = () => {
  const r = useReport<any>('low-stock');
  const { items: categorias, getAll: getCategorias } = useCategory();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const search = (f: any) => {
    const p = { threshold: f.threshold || 5, categoria: f.categoria };
    setFilters(p);
    r.fetch(p);
  };
  useEffect(() => { getCategorias(); search({}); }, []);

  const onExportPdf = () => exportFile(buildExportUrl('low-stock', 'pdf', { ...filters, threshold: filters.threshold || 5 }), 'pdf');
  const onExportExcel = () => exportFile(buildExportUrl('low-stock', 'xlsx', { ...filters, threshold: filters.threshold || 5 }), 'xlsx');

  const cols = [
    { title: 'Código', dataIndex: 'codigo', key: 'c', width: 100, sorter: (a: any, b: any) => (a.codigo || '').localeCompare(b.codigo || '') },
    { title: 'Producto', dataIndex: 'nombre', key: 'n', sorter: (a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || '') },
    { title: 'Categoría', dataIndex: 'categoria', key: 'cat', sorter: (a: any, b: any) => (a.categoria || '').localeCompare(b.categoria || '') },
    { title: 'Stock', dataIndex: 'stock', key: 's', width: 80, align: 'center' as const, sorter: (a: any, b: any) => a.stock - b.stock, render: (v: number) => <Tag color={v === 0 ? 'red' : 'orange'}>{v}</Tag> },
    { title: 'Precio', dataIndex: 'precio_venta', key: 'pv', width: 100, align: 'right' as const, sorter: (a: any, b: any) => a.precio_venta - b.precio_venta, render: (v: number) => `Q${Number(v).toFixed(2)}` },
  ];

  return (
    <Card size="small" title={<><WarningOutlined /> Stock Mínimo</>} styles={{ body: { padding: 12 } }}>
      <ReportFilters showThreshold showCategory categories={categorias.map(c => ({ value: c.idcategoria, label: c.nombre }))} onSearch={search} />
      <div style={{ textAlign: 'left', marginBottom: 8 }}><ReportExport onExportPdf={onExportPdf} onExportExcel={onExportExcel} /></div>
      <ReportTable columns={cols} data={r.data?.rows || []} rowKey="idarticulo" loading={r.loading}
        footerContent={<Text strong>{r.data?.count || 0} producto(s) con stock bajo</Text>} />
    </Card>
  );
};

/* ─── Más Vendidos ─── */
const TopProductsReport = () => {
  const r = useReport<any>('top-products');
  const { items: categorias, getAll: getCategorias } = useCategory();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const search = (f: any) => {
    const p = { from: f.from || '2000-01-01', to: f.to || '2100-12-31', categoria: f.categoria };
    setFilters(p);
    r.fetch(p);
  };
  useEffect(() => { getCategorias(); search({}); }, []);

  const onExportPdf = () => exportFile(buildExportUrl('top-products', 'pdf', { ...filters, from: filters.from || '2000-01-01', to: filters.to || '2100-12-31' }), 'pdf');
  const onExportExcel = () => exportFile(buildExportUrl('top-products', 'xlsx', { ...filters, from: filters.from || '2000-01-01', to: filters.to || '2100-12-31' }), 'xlsx');

  const cols = [
    { title: 'Código', dataIndex: 'codigo', key: 'c', width: 100, sorter: (a: any, b: any) => (a.codigo || '').localeCompare(b.codigo || '') },
    { title: 'Producto', dataIndex: 'nombre', key: 'n', sorter: (a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || '') },
    { title: 'Categoría', dataIndex: 'categoria', key: 'cat', sorter: (a: any, b: any) => (a.categoria || '').localeCompare(b.categoria || '') },
    { title: 'Cant.', dataIndex: 'cantidad_vendida', key: 'cv', width: 80, align: 'center' as const, sorter: (a: any, b: any) => a.cantidad_vendida - b.cantidad_vendida },
    { title: 'Ventas', dataIndex: 'num_ventas', key: 'nv', width: 80, align: 'center' as const, sorter: (a: any, b: any) => a.num_ventas - b.num_ventas },
    { title: 'Total', dataIndex: 'total_vendido', key: 'tv', width: 100, align: 'right' as const, sorter: (a: any, b: any) => a.total_vendido - b.total_vendido, render: (v: number) => `Q${Number(v).toFixed(2)}` },
  ];

  return (
    <Card size="small" title={<><RiseOutlined /> Productos Más Vendidos</>} styles={{ body: { padding: 12 } }}>
      <ReportFilters showDate showCategory categories={categorias.map(c => ({ value: c.idcategoria, label: c.nombre }))} onSearch={search} />
      <div style={{ textAlign: 'left', marginBottom: 8 }}><ReportExport onExportPdf={onExportPdf} onExportExcel={onExportExcel} /></div>
      <ReportTable columns={cols} data={r.data?.rows || []} rowKey="idarticulo" loading={r.loading}
        footerContent={<Text strong>{r.data?.count || 0} productos — {r.data?.totalCantidad || 0} unidades | Q{Number(r.data?.totalVendido || 0).toFixed(2)}</Text>} />
    </Card>
  );
};

/* ─── Inventario ─── */
const InventoryReport = () => {
  const r = useReport<any>('inventory');
  const { items: categorias, getAll: getCategorias } = useCategory();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const search = (f: any) => {
    const p: Record<string, any> = { categoria: f.categoria };
    if (f.stockGt !== undefined) p.stockMin = f.stockGt;
    setFilters(p);
    r.fetch(p);
  };
  useEffect(() => { getCategorias(); search({}); }, []);

  const exportParams = { ...filters };
  const onExportPdf = () => exportFile(buildExportUrl('inventory', 'pdf', exportParams), 'pdf');
  const onExportExcel = () => exportFile(buildExportUrl('inventory', 'xlsx', exportParams), 'xlsx');

  const cols = [
    { title: 'Código', dataIndex: 'codigo', key: 'c', width: 100, sorter: (a: any, b: any) => (a.codigo || '').localeCompare(b.codigo || '') },
    { title: 'Producto', dataIndex: 'nombre', key: 'n', sorter: (a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || '') },
    { title: 'Categoría', dataIndex: 'categoria', key: 'cat', sorter: (a: any, b: any) => (a.categoria || '').localeCompare(b.categoria || '') },
    { title: 'Stock', dataIndex: 'stock', key: 's', width: 80, align: 'center' as const, sorter: (a: any, b: any) => a.stock - b.stock },
    { title: 'Precio', dataIndex: 'precio_venta', key: 'pv', width: 100, align: 'right' as const, sorter: (a: any, b: any) => a.precio_venta - b.precio_venta, render: (v: number) => `Q${Number(v).toFixed(2)}` },
  ];

  return (
    <Card size="small" title={<><InboxOutlined /> Inventario</>} styles={{ body: { padding: 12 } }}>
      <ReportFilters showStockGt showCategory categories={categorias.map(c => ({ value: c.idcategoria, label: c.nombre }))} onSearch={search} />
      <div style={{ textAlign: 'left', marginBottom: 8 }}><ReportExport onExportPdf={onExportPdf} onExportExcel={onExportExcel} /></div>
      <ReportTable columns={cols} data={r.data?.rows || []} rowKey="idarticulo" loading={r.loading}
        footerContent={<Text strong>{r.data?.totalProductos || 0} productos | {r.data?.totalUnidades || 0} unidades | Valor: Q{Number(r.data?.totalValor || 0).toFixed(2)}</Text>} />
    </Card>
  );
};

/* ─── Resumen ─── */
const ComprehensiveReport = () => {
  const [period, setPeriod] = useState('this-month');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'custom' && dateRange[0] && dateRange[1]) {
        params.set('from', dateRange[0]);
        params.set('to', dateRange[1]);
      }
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reports/comprehensive/summary?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { fetchSummary(); }, [period]);

  const handleExport = async () => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && dateRange[0] && dateRange[1]) {
      params.set('from', dateRange[0]);
      params.set('to', dateRange[1]);
    }
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/reports/comprehensive/export?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { console.error(await res.text()); return; }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `resumen-${period}-${Date.now()}.xlsx`;
    a.click();
  };

  const cardStyle = { background: '#fafafa', borderRadius: 8, padding: '16px 20px', textAlign: 'center' as const };

  return (
    <Card size="small" title={<><PieChartOutlined /> Resumen del Período</>} styles={{ body: { padding: 12 } }}>
      <Row gutter={[8, 8]} style={{ marginBottom: 16, alignItems: 'center' }}>
        <Col>
          <Select value={period} onChange={v => { setPeriod(v); if (v !== 'custom') setDateRange(['', '']); }} size="small" style={{ width: 150 }}
            options={[
              { value: 'this-month', label: 'Este mes' },
              { value: 'last-month', label: 'Mes anterior' },
              { value: 'this-year', label: 'Este año' },
              { value: 'last-year', label: 'Año anterior' },
              { value: 'custom', label: 'Rango' },
            ]} />
        </Col>
        {period === 'custom' && (
          <Col>
            <DatePicker.RangePicker
              onChange={(_, ds) => {
                if (ds[0] && ds[1]) {
                  const diff = new Date(ds[1]).getTime() - new Date(ds[0]).getTime();
                  if (diff > 365 * 24 * 60 * 60 * 1000) return;
                }
                setDateRange([ds[0] || '', ds[1] || '']);
              }}
              size="small"
            />
          </Col>
        )}
        <Col>
          <Button type="primary" icon={<TableOutlined />} loading={loading} onClick={handleExport} size="small">
            Excel completo
          </Button>
        </Col>
      </Row>

      {data && (
        <>
          {/* ── KPI Cards ── */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <div style={{ ...cardStyle, borderTop: '3px solid #1677ff' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>Ventas</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>Q{data.totalVentas.toFixed(2)}</div>
                <Text type="secondary" style={{ fontSize: 10 }}>{data.facturas.count + data.tickets.count + data.boletas.count} docs</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ ...cardStyle, borderTop: '3px solid #52c41a' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>Compras</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>Q{data.totalCompras.toFixed(2)}</div>
                <Text type="secondary" style={{ fontSize: 10 }}>{data.compras.count} docs</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ ...cardStyle, borderTop: `3px solid ${data.ganancia >= 0 ? '#1677ff' : '#ff4d4f'}` }}>
                <Text type="secondary" style={{ fontSize: 11 }}>Ganancia</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: data.ganancia >= 0 ? '#1677ff' : '#ff4d4f' }}>Q{data.ganancia.toFixed(2)}</div>
                <Text type="secondary" style={{ fontSize: 10 }}>{data.margen.toFixed(1)}% margen</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ ...cardStyle, borderTop: '3px solid #722ed1' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>IVA Facturas</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}>Q{data.facturas.iva.toFixed(2)}</div>
                <Text type="secondary" style={{ fontSize: 10 }}>{data.facturas.count} facturas</Text>
              </div>
            </Col>
          </Row>

          {/* ── Breakdown + Metrics + Monthly ── */}
          <Row gutter={12}>
            <Col span={8}>
              <Card size="small" title="Desglose" styles={{ body: { padding: '8px 16px' } }}>
                {[
                  { label: 'Facturas (con IVA)', value: data.facturas.total, color: '#1677ff', count: data.facturas.count },
                  { label: 'Tickets (sin IVA)', value: data.tickets.total, color: '#52c41a', count: data.tickets.count },
                  { label: 'Boletas (sin IVA)', value: data.boletas.total, color: '#faad14', count: data.boletas.count },
                ].map((item, i) => (
                  <Row key={i} justify="space-between" style={{ padding: '6px 0', borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none' }}>
                    <Col><Tag color={item.color} style={{ fontSize: 11 }}>{item.label}</Tag></Col>
                    <Col style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>Q{item.value.toFixed(2)}</div>
                      <Text type="secondary" style={{ fontSize: 10 }}>{item.count} docs</Text>
                    </Col>
                  </Row>
                ))}
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Métricas" styles={{ body: { padding: '8px 16px' } }}>
                {(() => {
                  const totalDocs = data.facturas.count + data.tickets.count + data.boletas.count;
                  const promVenta = totalDocs > 0 ? data.totalVentas / totalDocs : 0;
                  const ivaPorc = data.totalVentas > 0 ? (data.facturas.iva / data.totalVentas) * 100 : 0;
                  const compraProm = data.compras.count > 0 ? data.totalCompras / data.compras.count : 0;
                  return (<>
                    <Row justify="space-between" style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <Col><Text strong>Documentos</Text></Col>
                      <Col style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{totalDocs} emitidos</div>
                        <Text type="secondary" style={{ fontSize: 10 }}>{data.dte.count} certificados DTE</Text>
                      </Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <Col><Text strong>Prom. Venta</Text></Col>
                      <Col style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>Q{promVenta.toFixed(2)}</div>
                        <Text type="secondary" style={{ fontSize: 10 }}>por documento</Text>
                      </Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <Col><Text strong>Prom. Compra</Text></Col>
                      <Col style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>Q{compraProm.toFixed(2)}</div>
                        <Text type="secondary" style={{ fontSize: 10 }}>por compra</Text>
                      </Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '6px 0' }}>
                      <Col><Text strong>IVA / Ventas</Text></Col>
                      <Col style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{ivaPorc.toFixed(1)}%</div>
                        <Text type="secondary" style={{ fontSize: 10 }}>del total facturado</Text>
                      </Col>
                    </Row>
                  </>);
                })()}
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Comportamiento Mensual" styles={{ body: { padding: 0 } }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1677ff', color: '#fff' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left' }}>Mes</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Ventas</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Compras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.mensual.map((m: any, i: number) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '3px 6px', fontWeight: 600 }}>{m.mes}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'right' }}>Q{m.ventas.toFixed(2)}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'right' }}>Q{m.compras.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, borderTop: '2px solid #1677ff' }}>
                      <td style={{ padding: '4px 6px' }}>Total</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>Q{data.totalVentas.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>Q{data.totalCompras.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Card>
  );
};

export default ReportPage;
export { ReportPage };
