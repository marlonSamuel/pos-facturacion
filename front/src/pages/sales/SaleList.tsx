import { useState, useMemo } from 'react';
import { Table, Tag, Button, Space, Modal, Input, Typography, Form } from 'antd';
import { EyeOutlined, StopOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import { printHtml, printPdf } from '../../helpers/printUtils';
import type { IVenta } from '../../interfaces/ISale';

const { Text } = Typography;

interface Props {
  items: IVenta[];
  loading: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => Promise<void>;
  onView: (id: number) => void;
  onCancel: (id: number, motivo?: string) => Promise<void>;
}

export const SaleList = ({ items, loading, total, page, pageSize, onPageChange, onView, onCancel }: Props) => {
  const [search, setSearch] = useState('');
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [form] = Form.useForm();
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(r =>
      r.cliente?.toLowerCase().includes(q) ||
      r.usuario?.toLowerCase().includes(q) ||
      `${r.serie_comprobante || ''}-${r.num_comprobante || ''}`.toLowerCase().includes(q) ||
      r.autorizacion?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const columns = [
    { title: '#', dataIndex: 'idventa', key: 'id', width: 60, sorter: (a: IVenta, b: IVenta) => a.idventa - b.idventa },
    { title: 'Fecha', dataIndex: 'fecha_hora', key: 'fecha', width: 130, sorter: (a: IVenta, b: IVenta) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
      render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente', ellipsis: true, sorter: (a: IVenta, b: IVenta) => (a.cliente || '').localeCompare(b.cliente || '') },
    {
      title: 'Tipo', dataIndex: 'tipo_comprobante', key: 'tipo', width: 80, sorter: (a: IVenta, b: IVenta) => (a.tipo_comprobante || '').localeCompare(b.tipo_comprobante || ''),
      render: (v: string) => (
        <Tag>{v === 'Factura' ? '📄 Factura' : v === 'Ticket' ? '🎫 Ticket' : '🧾 Boleta'}</Tag>
      )
    },
    {
      title: 'Pago', dataIndex: 'tipo_venta', key: 'pago', width: 75, sorter: (a: IVenta, b: IVenta) => (a.tipo_venta || '').localeCompare(b.tipo_venta || ''),
      render: (v: string) => v === 'CR' ? <Tag color="blue">📋 Crédito</Tag> : <Tag color="green">💰 Contado</Tag>
    },
    {
      title: 'No. Documento', key: 'doc', width: 180,
      render: (_: any, r: IVenta) => (
        <Text copyable={!!r.serie_comprobante} style={{ fontSize: 12, wordBreak: 'break-all' }}>
          {r.serie_comprobante ? `${r.serie_comprobante}-${r.num_comprobante}` : '-'}
        </Text>
      )
    },
    { title: 'Total', dataIndex: 'total_venta', key: 'total', width: 100, sorter: (a: IVenta, b: IVenta) => a.total_venta - b.total_venta,
      render: (v: number) => <Text strong>Q{Number(v).toFixed(2)}</Text> },
    { title: 'Usuario', dataIndex: 'usuario', key: 'usuario', width: 110, ellipsis: true, sorter: (a: IVenta, b: IVenta) => (a.usuario || '').localeCompare(b.usuario || '') },
    { title: 'Sucursal', dataIndex: 'sucursal', key: 'sucursal', width: 100, ellipsis: true },
    {
      title: 'Estado', dataIndex: 'estado', key: 'estado', width: 90, sorter: (a: IVenta, b: IVenta) => (a.estado || '').localeCompare(b.estado || ''),
      render: (v: string) => <Tag color={v === 'Aceptado' ? 'green' : 'red'}>{v}</Tag>
    },    { title: 'Motivo', dataIndex: 'motivo_anulacion', key: 'motivo', width: 100, render: (v: string) => v || '-' },    {
      title: 'Autorización', dataIndex: 'autorizacion', key: 'aut', width: 160,
      render: (v: string) => v ? (
        <Text copyable style={{ fontSize: 10, wordBreak: 'break-all', display: 'block', lineHeight: 1.3 }}>{v}</Text>
      ) : '-'
    },
    {
      title: 'Acciones', key: 'acciones', width: 130,
      render: (_: any, r: IVenta) => (
        <Space size={0}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => onView(r.idventa)} size="small" />
          {r.estado === 'Aceptado' && (
            <Button type="link" icon={<PrinterOutlined />} onClick={async () => {
              if (r.tipo_comprobante === 'Ticket') {
                const { saleService } = await import('../../services/saleService');
                const det = await saleService.getById(r.idventa);
                const items = (det.detalles || []).map(d =>
                  `<tr><td>${d.cantidad}</td><td>${d.articulo || ''}</td><td align="right">Q${d.subtotal.toFixed(2)}</td></tr>`
                ).join('');
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ticket</title>
                <style>
                  body{font-family:monospace;font-size:13px;max-width:300px;margin:auto;padding:10px}
                  h2{text-align:center;margin:4px 0}
                  .info{text-align:center;font-size:12px;margin:2px 0}
                  table{width:100%;border-collapse:collapse}
                  th,td{padding:3px 4px;text-align:left}
                  th{border-bottom:1px solid #000}
                  .total{font-weight:bold;border-top:2px solid #000;padding-top:4px}
                  .footer{text-align:center;margin-top:12px;font-size:12px}
                  hr{border:none;border-top:1px dashed #000}
                </style></head><body>
                  <h2>NEW HORIZON</h2>
                  <p class="info">Chiquimulilla, Santa Rosa<br>Tel: 55774465</p>
                  <hr>
                  <p><b>Ticket:</b> ${r.serie_comprobante || ''}-${r.num_comprobante || ''}</p>
                  <p><b>Fecha:</b> ${new Date(r.fecha_hora).toLocaleString()}</p>
                  <p><b>Cliente:</b> ${det.cliente || 'Consumidor Final'}</p>
                  <hr>
                  <table><tr><th>Cant</th><th>Descripción</th><th align="right">Total</th></tr>
                  ${items}</table>
                  <hr>
                  <p class="total">TOTAL: Q${r.total_venta.toFixed(2)}</p>
                  <p>Arts: ${det.detalles?.reduce((s,d) => s + d.cantidad, 0) || 0}</p>
                  <hr>
                  <p class="footer">¡Gracias por su compra!<br>New Horizon</p>
                </body></html>`;
                printHtml(html);
              } else {
                const api = (await import('../../api/axios')).default;
                const resp = await api.get(`/sales/${r.idventa}/pdf`, { responseType: 'blob' });
                printPdf(URL.createObjectURL(resp.data));
              }
            }} size="small" />
          )}
          {r.estado === 'Aceptado' && (
            <Button type="link" danger icon={<StopOutlined />} size="small" onClick={() => { setCancelId(r.idventa); form.resetFields(); }} />
          )}
        </Space>
      )
    }
  ];

  const handleConfirmCancel = async () => {
    try {
      const values = await form.validateFields();
      if (cancelId === null) return;
      setCancelLoading(true);
      await onCancel(cancelId, values.motivo_anulacion);
      form.resetFields();
      setCancelId(null);
    } catch { /* validation failed */ }
    finally { setCancelLoading(false); }
  };

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Input prefix={<SearchOutlined />} placeholder="Buscar por cliente, usuario, documento o autorización..."
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small" style={{ maxWidth: 450 }} />
      </div>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="idventa"
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
      <Modal
        title="Anular venta"
        open={cancelId !== null}
        onOk={handleConfirmCancel}
        onCancel={() => { setCancelId(null); form.resetFields(); }}
        okText="Anular"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, loading: cancelLoading }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <p style={{ marginBottom: 12 }}>Se revertirá stock y DTE si aplica.</p>
          <Form.Item
            name="motivo_anulacion"
            rules={[
              { required: true, message: 'El motivo es obligatorio' },
              { max: 100, message: 'Máximo 100 caracteres' }
            ]}
          >
            <Input placeholder="Motivo de anulación" maxLength={100} showCount onPressEnter={handleConfirmCancel} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
