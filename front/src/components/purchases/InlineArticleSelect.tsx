import { useState, useEffect } from 'react';
import { Select, Divider, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { articleService } from '../../services/articleService';
import { useCategory } from '../../hooks/useCategory';
import { ArticleForm } from '../../pages/inventory/articles/ArticleForm';
import type { IArticle } from '../../interfaces/IArticle';

interface Props {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  excludeIds?: number[];
}

export const InlineArticleSelect = ({ value, onChange, placeholder, excludeIds }: Props) => {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const { items: categories, getAll: getCategories } = useCategory();

  useEffect(() => {
    fetchArticles();
    getCategories();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try { setArticles(await articleService.getAll()); }
    catch { /* ignore */ }
    setLoading(false);
  };

  const handleCreated = async (formData: FormData) => {
    const created = await articleService.create(formData);
    await fetchArticles();
    if (onChange && (created as any).idarticulo) onChange((created as any).idarticulo);
    setFormOpen(false);
  };

  return (
    <>
      <Select
        showSearch={{ filterOption: (input, option) =>
          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }}
        placeholder={placeholder || 'Seleccione artículo'}
        value={value}
        onChange={onChange}
        loading={loading}
        style={{ width: '100%' }}
        popupRender={menu => (
          <div>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Button type="link" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}
              style={{ padding: '4px 12px', width: '100%', textAlign: 'left' }}>
              Agregar nuevo artículo
            </Button>
          </div>
        )}
        options={articles
          .filter(a => a.condicion && !excludeIds?.includes(a.idarticulo))
          .map(a => ({
            value: a.idarticulo,
            label: a.codigo ? `${a.nombre} (${a.codigo})` : a.nombre
          }))}
      />

      <ArticleForm
        open={formOpen}
        editing={null}
        categories={categories}
        onOk={handleCreated}
        onCancel={() => setFormOpen(false)}
        hideStock
      />
    </>
  );
};
