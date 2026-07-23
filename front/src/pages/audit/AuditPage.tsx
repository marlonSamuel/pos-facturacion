import { useState, useEffect } from 'react';
import { Table, Typography, Card, Tag, Select, DatePicker, Row, Col } from 'antd';
import api from '../../api/axios';

const { Title, Text } = Typography;

const AuditPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tabla, setTabla] = useState<string | undefined>(undefined);
  const [tablas, setTablas] = useState<string[]>([]);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);

  const fetchLogs = async (p: number, t?: string, f?: string, toDate?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '50' });
      if (t) params.set('tabla', t);
      if (f) params.set('from', f);
      if (toDate) params.set('to', toDate);
      const r = await api.get(`/audit/logs?${params}`);
      setData(r.data.rows || []);
      setTotal(r.data.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(page, tabla, from, to); }, [page, tabla, from, to]);

  useEffect(() => {
    api.get('/audit/tables').then(r => setTablas(r.data || [])).catch(() => {});
  }, []);

  const columns = [
    { title: 'Fecha', dataIndex: 'createdAt', key: 'fecha', width: 190,
      render: (v: string) => v ? new Date(v).toLocaleString('es-GT') : '', defaultSortOrder: 'descend' as const, sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() },
    { title: 'Usuario', dataIndex: 'usuario', key: 'usuario', width: 120 },
    {
      title: 'Acción', dataIndex: 'accion', key: 'accion', width: 100,
      render: (v: string) => {
        const color: Record<string, string> = { CREAR: 'green', EDITAR: 'blue', ANULAR: 'red', LOGIN: 'purple', ELIMINAR: 'red' };
        return <Tag color={color[v] || 'default'}>{v}</Tag>;
      }
    },
    { title: 'Tabla', dataIndex: 'tabla', key: 'tabla', width: 150 },
    { title: 'Registro', dataIndex: 'registro_id', key: 'id', width: 80 },
    { title: 'Detalle', dataIndex: 'detalle', key: 'detalle', ellipsis: true,
      render: (v: string) => v ? <Text copyable style={{ fontSize: 11 }}>{v.substring(0, 120)}{v.length > 120 ? '...' : ''}</Text> : '-' },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 130 },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <Title level={4} style={{ marginBottom: 16 }}>Auditoría</Title>
      <Card size="small" styles={{ body: { padding: 12 } }}>
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          <Col>
            <Select allowClear placeholder="Filtrar por tabla" value={tabla} onChange={v => { setTabla(v); setPage(1); }}
              size="small" style={{ minWidth: 150 }} options={tablas.map(t => ({ value: t, label: t }))} />
          </Col>
          <Col>
            <DatePicker.RangePicker size="small" onChange={(_, ds) => {
              setFrom(ds[0] || undefined);
              setTo(ds[1] || undefined);
              setPage(1);
            }} />
          </Col>
        </Row>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="idbitacora"
          loading={loading}
          pagination={{
            current: page,
            pageSize: 50,
            total,
            onChange: p => setPage(p),
            showTotal: t => `${t} registros`,
            showSizeChanger: false,
          }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AuditPage;
export { AuditPage };
