import { useState, useEffect } from 'react';
import { Select, Divider, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { personService } from '../../services/personService';
import { PersonForm } from '../../pages/persons/PersonForm';
import type { IPerson } from '../../interfaces/IPerson';

interface Props {
  value?: number;
  onChange?: (value: number, option?: { label: string }) => void;
  placeholder?: string;
}

export const InlineClientSelect = ({ value, onChange, placeholder }: Props) => {
  const [clients, setClients] = useState<IPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try { setClients(await personService.getAll('Cliente')); }
    catch { /* ignore */ }
    setLoading(false);
  };

  const handleCreated = async (values: Partial<IPerson>) => {
    const created = await personService.create({ ...values, tipo_persona: 'Cliente' });
    await fetchClients();
    if (onChange && (created as any).idpersona) onChange((created as any).idpersona, { label: (created as any).nombre });
    setFormOpen(false);
  };

  return (
    <>
      <Select
        showSearch={{ filterOption: (input, option) =>
          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }}
        placeholder={placeholder || 'Seleccione cliente'}
        value={value}
        onChange={(value, option) => onChange?.(value as number, option as { label: string })}
        loading={loading}
        style={{ width: '100%' }}
        popupRender={menu => (
          <div>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Button type="link" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}
              style={{ padding: '4px 12px', width: '100%', textAlign: 'left' }}>
              Agregar nuevo cliente
            </Button>
          </div>
        )}
        options={clients.map(c => ({
          value: c.idpersona,
          label: c.nombre
        }))}
      />

      <PersonForm
        open={formOpen}
        editing={null}
        tipo="Cliente"
        onOk={handleCreated}
        onCancel={() => setFormOpen(false)}
      />
    </>
  );
};
