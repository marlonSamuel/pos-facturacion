import { useState, useRef, useEffect } from 'react';
import { Drawer, Input, List, Tag, Typography, Spin, Empty } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { articleService } from '../../services/articleService';

const { Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const PriceChecker = ({ open, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await articleService.search(query.trim(), 20, 0, undefined);
        setResults(data.rows || data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <Drawer
      title="Consultar Precio"
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Input
          ref={inputRef}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          suffix={query ? <CloseOutlined onClick={() => { setQuery(''); inputRef.current?.focus(); }} style={{ color: '#bfbfbf', cursor: 'pointer' }} /> : null}
          placeholder="Buscar por nombre o código..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          size="middle"
          allowClear
        />
      </div>
      <div style={{ padding: query ? '4px 0' : '40px 16px' }}>
        {!query.trim() ? (
          <Empty description="Escribe para buscar productos" style={{ marginTop: 40 }} />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : results.length === 0 ? (
          <Empty description="Sin resultados" />
        ) : (
          <List
            dataSource={results}
            renderItem={(item: any) => (
              <List.Item style={{ padding: '8px 16px', cursor: 'default' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
                  {item.imagen && item.imagen !== 'default.png' ? (
                    <img src={`${API_URL.replace('/api', '')}/uploads/products/${item.imagen}`} alt={item.nombre}
                      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, background: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 13 }} ellipsis>{item.nombre}</Text>
                      <Text strong style={{ fontSize: 15, color: '#1677ff', marginLeft: 8, whiteSpace: 'nowrap' }}>Q{Number(item.precio_venta || 0).toFixed(2)}</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                      {item.codigo && <Text type="secondary" style={{ fontSize: 11 }}>{item.codigo}</Text>}
                      <Tag color={item.stock > 0 ? (item.stock <= 5 ? 'orange' : 'green') : 'red'} style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}>
                        Stock: {item.stock || 0}
                      </Tag>
                    </div>
                    {item.stockPorSucursal && item.stockPorSucursal.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {item.stockPorSucursal.map((s: any) => (
                          <Tag
                            key={s.idsucursal}
                            color={s.actual ? 'blue' : 'default'}
                            style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}
                            bordered={!s.actual}
                          >
                            {s.nombre}: {s.stock}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </Drawer>
  );
};
