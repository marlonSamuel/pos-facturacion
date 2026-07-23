import { useState, useMemo } from 'react';
import { Table, Tag, Button, Space, Modal, Input, Typography, Form } from 'antd';
import { EyeOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import type { IPurchase } from '../../interfaces/IPurchase';

const { Text } = Typography;

interface Props {
  items: IPurchase[];
  loading: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => Promise<void>;
  onView: (id: number) => void;
  onCancel: (id: number, motivo?: string) => Promise<void>;
}

export const PurchaseList = ({ items, loading, total, page, pageSize, onPageChange, onView, onCancel }: Props) => {
  const [search, setSearch] = useState('');
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [form] = Form.useForm();
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(r =>
      r.proveedor?.toLowerCase().includes(q) ||
      r.usuario?.toLowerCase().includes(q) ||
      `${r.tipo_comprobante} ${r.serie_comprobante || ''}-${r.num_comprobante}`.toLowerCase().includes(q)
    );
  }, [items, search]);

  const columns = [
    { title: '#', dataIndex: 'idingreso', key: 'id', width: 60, sorter: (a: IPurchase, b: IPurchase) => a.idingreso - b.idingreso },
    { title: 'Fecha', dataIndex: 'fecha_hora', key: 'fecha', width: 110, sorter: (a: IPurchase, b: IPurchase) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
      render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Proveedor', dataIndex: 'proveedor', key: 'proveedor', ellipsis: true, sorter: (a: IPurchase, b: IPurchase) => (a.proveedor || '').localeCompare(b.proveedor || '') },
    { title: 'Comprobante', key: 'comp', width: 160,
      render: (_: any, r: IPurchase) => `${r.tipo_comprobante} ${r.serie_comprobante || ''}-${r.num_comprobante}` },
    { title: 'Total', dataIndex: 'total_compra', key: 'total', width: 110, sorter: (a: IPurchase, b: IPurchase) => a.total_compra - b.total_compra,
      render: (v: number) => <Text strong>Q{Number(v).toFixed(2)}</Text> },
    { title: 'Usuario', dataIndex: 'usuario', key: 'usuario', width: 120, ellipsis: true, sorter: (a: IPurchase, b: IPurchase) => (a.usuario || '').localeCompare(b.usuario || '') },
    { title: 'Sucursal', dataIndex: 'sucursal', key: 'sucursal', width: 100, ellipsis: true },
    {
      title: 'Estado', dataIndex: 'estado', key: 'estado', width: 100,
      render: (v: string) => <Tag color={v === 'Aceptado' ? 'green' : 'red'}>{v}</Tag>
    },
    { title: 'Motivo', dataIndex: 'motivo_anulacion', key: 'motivo', width: 100, render: (v: string) => v || '-' },
    {
      title: 'Acciones', key: 'acciones', width: 100,
      render: (_: any, r: IPurchase) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => onView(r.idingreso)} />
          {r.estado === 'Aceptado' && (
            <Button type="link" danger icon={<CloseCircleOutlined />} onClick={() => { setCancelId(r.idingreso); form.resetFields(); }} />
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
        <Input prefix={<SearchOutlined />} placeholder="Buscar por proveedor, usuario o comprobante..."
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small" style={{ maxWidth: 400 }} />
      </div>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="idingreso"
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
        title="Anular compra"
        open={cancelId !== null}
        onOk={handleConfirmCancel}
        onCancel={() => { setCancelId(null); form.resetFields(); }}
        okText="Anular"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, loading: cancelLoading }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <p style={{ marginBottom: 12 }}>Se revertirá el stock. ¿Continuar?</p>
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
