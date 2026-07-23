import { useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useArticle } from '../../../hooks/useArticle';
import { useCategory } from '../../../hooks/useCategory';
import { ArticleList } from './ArticleList';
import { ArticleForm } from './ArticleForm';
import type { IArticle } from '../../../interfaces/IArticle';

const { Title } = Typography;

export const IndexArticle = () => {
  const { items, loading, total, page, pageSize, getAllPaginated, create, update, remove } = useArticle();
  const { items: categories, getAll: getCategories } = useCategory();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IArticle | null>(null);

  useEffect(() => { getAllPaginated(); getCategories(); }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (record: IArticle) => { setEditing(record); setModalOpen(true); };

  const handleOk = async (formData: FormData) => {
    let ok = false;
    if (editing) {
      ok = await update(editing.idarticulo, formData);
    } else {
      ok = await create(formData);
    }
    if (ok) setModalOpen(false);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Artículos</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nuevo Artículo
        </Button>
      </div>

      <ArticleList
        items={items}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={getAllPaginated}
        onEdit={openEdit}
        onDelete={remove}
      />

      <ArticleForm
        open={modalOpen}
        editing={editing}
        categories={categories}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
};
