import { useState, useEffect } from 'react';
import { Select, Divider, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { personService } from '../../services/personService';
import { PersonForm } from '../../pages/persons/PersonForm';
import type { IPerson } from '../../interfaces/IPerson';

interface Props {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
}

export const InlineProviderSelect = ({ value, onChange, placeholder }: Props) => {
  const [providers, setProviders] = useState<IPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try { setProviders(await personService.getAll('Proveedor')); }
    catch { /* ignore */ }
    setLoading(false);
  };

  const handleCreated = async (values: Partial<IPerson>) => {
    const created = await personService.create({ ...values, tipo_persona: 'Proveedor' });
    await fetchProviders();
    if (onChange && (created as any).idpersona) onChange((created as any).idpersona);
    setFormOpen(false);
  };

  return (
    <>
      <Select
        showSearch={{ filterOption: (input, option) =>
          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }}
        placeholder={placeholder || 'Seleccione proveedor'}
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
              Agregar nuevo proveedor
            </Button>
          </div>
        )}
        options={providers.map(p => ({ value: p.idpersona, label: p.nombre }))}
      />

      <PersonForm
        open={formOpen}
        editing={null}
        tipo="Proveedor"
        onOk={handleCreated}
        onCancel={() => setFormOpen(false)}
      />
    </>
  );
};
