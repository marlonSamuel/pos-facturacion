import { useEffect, useState, useContext } from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useArticle } from '../../../hooks/useArticle';
import { useCategory } from '../../../hooks/useCategory';
import { AuthContext } from '../../../context/auth/AuthContext';
import { ArticleList } from './ArticleList';
import { ArticleForm } from './ArticleForm';
import type { IArticle } from '../../../interfaces/IArticle';

const { Title } = Typography;

export const IndexArticle = () => {
  const { items, loading, total, page, pageSize, getAllPaginated, create, update, remove } = useArticle();
  const { items: categories, getAll: getCategories } = useCategory();
  const { user } = useContext(AuthContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IArticle | null>(null);
  const [userSucursales, setUserSucursales] = useState<any[]>([]);
  const userSucursalIds = user?.sucursales || [];

  useEffect(() => {
    getAllPaginated();
    getCategories();
    // Cargar nombres de sucursales del usuario
    if (userSucursalIds.length > 0) {
      import('../../../services/sucursalService').then(({ sucursalService }) =>
        sucursalService.getAll().then(list => {
          setUserSucursales(list.filter((s: any) => userSucursalIds.includes(s.idsucursal)));
        })
      );
    }
  }, []);

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
        sucursales={userSucursales}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
};
