import { useState, useMemo } from 'react';
import { Table, Button, Space, Popconfirm, Image, Tooltip, Typography, Input } from 'antd';
import { EditOutlined, DeleteOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import Barcode from 'react-barcode';
import JsBarcode from 'jsbarcode';
import type { IArticle } from '../../../interfaces/IArticle';

const { Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Props {
  items: IArticle[];
  loading: boolean;  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number, all?: boolean) => Promise<void>;  onEdit: (record: IArticle) => void;
  onDelete: (id: number) => void;
}

const printBarcode = (codigo: string, nombre: string) => {
  // Generar SVG del código de barras en memoria (tamaño estandarizado)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, codigo, { width: 2, height: 60, displayValue: false });
  const svgHtml = svg.outerHTML;

  // Crear iframe oculto para imprimir
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-1000px';
  iframe.style.left = '-1000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <html><head><title>${nombre}</title>
    <style>body{text-align:center;padding:40px 20px;font-family:Arial,sans-serif}
    h3{margin:0 0 20px;font-size:16px;color:#333}
    .code{font-size:20px;letter-spacing:2px;margin-top:12px;color:#000}</style>
    </head><body>
    <h3>${nombre}</h3>
    <div style="width:250px;margin:0 auto">${svgHtml}</div>
    <p class="code">${codigo}</p>
    </body></html>
  `);
  doc.close();

  // Imprimir el iframe
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  // Limpiar después de imprimir
  const cleanUp = () => {
    setTimeout(() => { document.body.removeChild(iframe); }, 100);
  };
  if (iframe.contentWindow) {
    iframe.contentWindow.onafterprint = cleanUp;
    // Fallback si onafterprint no se ejecuta
    setTimeout(cleanUp, 5000);
  }
};

const printAll = (items: IArticle[]) => {
  if (items.length === 0) return;
  
  const svgs = items.map(item => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (item.codigo) {
      JsBarcode(svg, item.codigo, { width: 1.5, height: 40, displayValue: false, margin: 0 });
    }
    return { nombre: item.nombre, codigo: item.codigo || '', svg: svg.outerHTML };
  });

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-1000px';
  iframe.style.left = '-1000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <html><head><title>Códigos de barras</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px}
      .item{display:inline-block;text-align:center;margin:10px;padding:10px;border:1px dashed #ccc;border-radius:6px;width:220px}
      .name{font-size:12px;margin-bottom:6px;color:#333}
      .code{font-size:14px;letter-spacing:1px;color:#000;margin-top:4px}
      @media print{.item{border:none}}
    </style>
    </head><body>
    ${svgs.map(s => `<div class="item"><div class="name">${s.nombre}</div><div style="width:200px;margin:0 auto">${s.svg}</div><div class="code">${s.codigo}</div></div>`).join('')}
    </body></html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  const cleanUp = () => setTimeout(() => document.body.removeChild(iframe), 100);
  if (iframe.contentWindow) iframe.contentWindow.onafterprint = cleanUp;
  setTimeout(cleanUp, 5000);
};

export const ArticleList = ({ items, loading, total, page, pageSize, onPageChange, onEdit, onDelete }: Props) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(r =>
      r.nombre?.toLowerCase().includes(q) ||
      r.codigo?.toLowerCase().includes(q) ||
      (r.categoria as any)?.nombre?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const hasBarcodes = items.some(i => i.codigo);
  const sorterStr = (a: IArticle, b: IArticle, field: string) => ((a as any)[field] || '').localeCompare((b as any)[field] || '');

  const columns = [
    {
      title: '', dataIndex: 'imagen', key: 'img', width: 56,
      render: (img: string) => (
        <Image
          src={img ? `${API_URL.replace('/api', '')}/uploads/products/${img}` : undefined}
          width={36} height={36}
          style={{ borderRadius: 6, objectFit: 'cover' }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      )
    },
    {
      title: 'Código / Barra', key: 'codigo', width: 140, sorter: (a: IArticle, b: IArticle) => sorterStr(a, b, 'codigo'),
      render: (_: any, record: IArticle) => record.codigo ? (
        <div style={{ lineHeight: 0 }}>
          <Text style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{record.codigo}</Text>
          <div style={{ width: 130, overflow: 'hidden' }}>
            <Barcode value={record.codigo} width={1} height={24} displayValue={false} margin={0} />
          </div>
        </div>
      ) : <Text type="secondary">—</Text>
    },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', sorter: (a: IArticle, b: IArticle) => (a.nombre || '').localeCompare(b.nombre || '') },
    { title: 'Precio', dataIndex: 'precio_venta', key: 'precio', width: 90, align: 'right' as const,
      render: (v: number) => v ? `Q${Number(v).toFixed(2)}` : '-',
      sorter: (a: IArticle, b: IArticle) => (a.precio_venta || 0) - (b.precio_venta || 0)
    },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', width: 60, align: 'center' as const,
      render: (v: number) => <Text>{v ?? '-'}</Text>,
      sorter: (a: IArticle, b: IArticle) => (a.stock || 0) - (b.stock || 0)
    },
    { title: 'Categoría', key: 'categoria', width: 120, sorter: (a: IArticle, b: IArticle) => sorterStr(a, b, 'categoria'),
      render: (_: any, r: IArticle) => (r.categoria as any)?.nombre },
    {
      title: 'Acciones', key: 'acciones', width: 150,
      render: (_: any, record: IArticle) => (
        <Space>
          {record.codigo && (
            <Tooltip title="Imprimir etiqueta">
              <Button type="link" icon={<PrinterOutlined />} onClick={() => printBarcode(record.codigo, record.nombre)} />
            </Tooltip>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title="Eliminar artículo"
            description="¿Está seguro? Esta acción no se puede deshacer."
            onConfirm={() => onDelete(record.idarticulo)}
            okText="Eliminar"
            cancelText="Cancelar"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <Input prefix={<SearchOutlined />} placeholder="Buscar por nombre, código o categoría..."
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small" style={{ maxWidth: 400 }} />
        {hasBarcodes && (
          <Button type="default" icon={<PrinterOutlined />} onClick={() => printAll(items)} size="small">
            Imprimir códigos
          </Button>
        )}
      </div>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="idarticulo"
        loading={loading}
        pagination={{
          current: page || 1,
          pageSize: pageSize || 10,
          total: total || items.length,
          responsive: true,
          showSizeChanger: true,
          showTotal: t => `${t} registros`,
          onChange: (p, ps) => onPageChange?.(p, ps),
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </div>
  );
};
