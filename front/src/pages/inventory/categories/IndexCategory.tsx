import { useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCategory } from '../../../hooks/useCategory';
import { CategoryList } from './CategoryList';
import { CategoryForm } from './CategoryForm';
import type { ICategory } from '../../../interfaces/ICategory';

const { Title } = Typography;

export const IndexCategory = () => {
  const { items, loading, getAll, create, update, remove } = useCategory();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ICategory | null>(null);

  useEffect(() => { getAll(); }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (record: ICategory) => { setEditing(record); setModalOpen(true); };

  const handleOk = async (values: Partial<ICategory>) => {
    let ok = false;
    if (editing) {
      ok = await update(editing.idcategoria, values);
    } else {
      ok = await create(values);
    }
    if (ok) setModalOpen(false);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Categorías</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nueva Categoría
        </Button>
      </div>

      <CategoryList
        items={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={remove}
      />

      <CategoryForm
        open={modalOpen}
        editing={editing}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
};
