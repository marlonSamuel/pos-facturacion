import { useState, useMemo } from 'react';
import { Table, Button, Space, Popconfirm, Input } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ICategory } from '../../../interfaces/ICategory';

interface Props {
  items: ICategory[];
  loading: boolean;
  onEdit: (record: ICategory) => void;
  onDelete: (id: number) => void;
}

export const CategoryList = ({ items, loading, onEdit, onDelete }: Props) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(r => r.nombre?.toLowerCase().includes(q) || r.descripcion?.toLowerCase().includes(q));
  }, [items, search]);

  const columns = [
    { title: 'ID', dataIndex: 'idcategoria', key: 'id', width: 80, sorter: (a: ICategory, b: ICategory) => a.idcategoria - b.idcategoria },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', sorter: (a: ICategory, b: ICategory) => (a.nombre || '').localeCompare(b.nombre || '') },
    { title: 'Descripción', dataIndex: 'descripcion', key: 'desc', ellipsis: true },
    {
      title: 'Acciones', key: 'acciones', width: 120,
      render: (_: any, record: ICategory) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title="Eliminar categoría"
            description="¿Está seguro? Esta acción no se puede deshacer."
            onConfirm={() => onDelete(record.idcategoria)}
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
        <Input prefix={<SearchOutlined />} placeholder="Buscar categoría..."
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small" style={{ maxWidth: 300 }} />
      </div>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="idcategoria"
        loading={loading}
        pagination={{ pageSize: 10, responsive: true, showSizeChanger: true, showTotal: t => `${t} registros` }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </>
  );
};
