import { useState, useMemo } from 'react';
import { Table, Button, Space, Popconfirm, Input } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { IPerson } from '../../interfaces/IPerson';

interface Props {
  items: IPerson[];
  loading: boolean;
  onEdit: (record: IPerson) => void;
  onDelete: (id: number) => void;
}

export const PersonList = ({ items, loading, onEdit, onDelete }: Props) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(r =>
      r.nombre?.toLowerCase().includes(q) ||
      r.num_documento?.toLowerCase().includes(q) ||
      r.telefono?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const columns = [
    { title: 'ID', dataIndex: 'idpersona', key: 'id', width: 70, sorter: (a: IPerson, b: IPerson) => a.idpersona - b.idpersona },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', sorter: (a: IPerson, b: IPerson) => (a.nombre || '').localeCompare(b.nombre || '') },
    { title: 'Documento', dataIndex: 'num_documento', key: 'doc', width: 120, sorter: (a: IPerson, b: IPerson) => (a.num_documento || '').localeCompare(b.num_documento || '') },
    { title: 'Teléfono', dataIndex: 'telefono', key: 'tel', width: 120 },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    { title: 'Dirección', dataIndex: 'direccion', key: 'dir', ellipsis: true },
    {
      title: 'Acciones', key: 'acciones', width: 100,
      render: (_: any, record: IPerson) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title="Eliminar"
            description="¿Está seguro? Esta acción no se puede deshacer."
            onConfirm={() => onDelete(record.idpersona)}
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
    <>
      <div style={{ marginBottom: 12 }}>
        <Input prefix={<SearchOutlined />} placeholder="Buscar por nombre, documento, teléfono o email..."
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small" style={{ maxWidth: 400 }} />
      </div>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="idpersona"
        loading={loading}
        pagination={{ pageSize: 10, responsive: true, showSizeChanger: true, showTotal: t => `${t} registros` }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </>
  );
};
