import { Table, Button, Space, Tag, Switch, Avatar, Tooltip } from 'antd';
import { EditOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import type { IUser } from '../../interfaces/IUser';
import type { ISucursalInfo } from '../../services/sucursalService';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

interface Props {
  items: IUser[];
  loading: boolean;
  sucursales: ISucursalInfo[];
  onEdit: (record: IUser) => void;
  onToggleStatus: (id: number) => void;
  onChangePassword: (record: IUser) => void;
}

export const UserList = ({ items, loading, sucursales, onEdit, onToggleStatus, onChangePassword }: Props) => {
  const columns = [
    {
      title: '', key: 'avatar', width: 50,
      render: (_: any, record: IUser) => (
        record.imagen && record.imagen !== 'default.png'
          ? <Avatar src={`${API_URL}/uploads/users/${record.imagen}`} />
          : <Avatar icon={<UserOutlined />} style={{ background: 'var(--blue-primary)' }} />
      )
    },
    { title: 'ID', dataIndex: 'idusuario', key: 'idusuario', width: 70 },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', ellipsis: true },
    { title: 'Documento', dataIndex: 'num_documento', key: 'num_documento', width: 120 },
    { title: 'Login', dataIndex: 'login', key: 'login', width: 110 },
    { title: 'Rol', dataIndex: 'rol', key: 'rol', width: 110, render: (v: string | null) => v || <Tag>-</Tag> },
    {
      title: 'Sucursales', key: 'sucursales', width: 160,
      render: (_: any, record: IUser) => (
        record.sucursales && record.sucursales.length > 0
          ? record.sucursales.map(sid => {
              const s = sucursales.find(s => s.idsucursal === sid);
              return <Tag key={sid} color="blue" style={{ marginBottom: 2 }}>{s?.nombre || `#${sid}`}</Tag>;
            })
          : <Tag>-</Tag>
      )
    },
    { title: 'Teléfono', dataIndex: 'telefono', key: 'telefono', width: 110 },
    {
      title: 'Estado', dataIndex: 'condicion', key: 'condicion', width: 90,
      render: (condicion: number) => (
        <Tag color={condicion === 1 ? 'green' : 'red'}>
          {condicion === 1 ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    },
    {
      title: 'Acciones', key: 'acciones', width: 140,
      render: (_: any, record: IUser) => (
        <Space>
          <Tooltip title="Editar usuario">
            <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title="Cambiar contraseña">
            <Button type="link" icon={<LockOutlined />} onClick={() => onChangePassword(record)} />
          </Tooltip>
          <Switch
            checked={record.condicion === 1}
            checkedChildren={<span>Activo</span>}
            unCheckedChildren={<span>Inactivo</span>}
            onChange={() => onToggleStatus(record.idusuario)}
            size="small"
          />
        </Space>
      )
    }
  ];

  return (
    <Table
      dataSource={items}
      columns={columns}
      rowKey="idusuario"
      loading={loading}
      pagination={{ pageSize: 10, responsive: true }}
      scroll={{ x: 'max-content' }}
      size="middle"
    />
  );
};
