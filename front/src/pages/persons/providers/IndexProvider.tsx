import { useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usePerson } from '../../../hooks/usePerson';
import { PersonList } from '../PersonList';
import { PersonForm } from '../PersonForm';
import type { IPerson } from '../../../interfaces/IPerson';

const { Title } = Typography;

export const IndexProvider = () => {
  const { items, loading, getAll, create, update, remove } = usePerson('Proveedor');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IPerson | null>(null);

  useEffect(() => { getAll(); }, []);

  const handleOk = async (values: Partial<IPerson>) => {
    const ok = editing
      ? await update(editing.idpersona, values)
      : await create(values);
    if (ok) setModalOpen(false);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Proveedores</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          Nuevo Proveedor
        </Button>
      </div>
      <PersonList items={items} loading={loading} onEdit={(r) => { setEditing(r); setModalOpen(true); }} onDelete={remove} />
      <PersonForm open={modalOpen} editing={editing} tipo="Proveedor" onOk={handleOk} onCancel={() => setModalOpen(false)} />
    </>
  );
};
