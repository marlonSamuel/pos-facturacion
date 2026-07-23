import { useEffect, useState } from 'react';
import { Button, Typography, Table, Space, Tag, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRole } from '../../hooks/useRole';
import { RoleForm } from './RoleForm';
import type { IRol } from '../../interfaces/IRol';
import type { IPermission } from '../../interfaces/IUser';
import { userService } from '../../services/userService';

const { Title } = Typography;

export const RolePage = () => {
  const { items, loading, getAll, create, update, remove } = useRole();
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IRol | null>(null);

  useEffect(() => {
    getAll();
    userService.getPermissions().then(setPermissions).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (record: IRol) => { setEditing(record); setModalOpen(true); };

  const handleOk = async (data: { nombre: string; descripcion?: string; permisos: number[] }) => {
    let ok = false;
    if (editing) {
      ok = await update(editing.idrol, data);
    } else {
      ok = await create(data);
    }
    if (ok) setModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  const columns = [
    { title: 'ID', dataIndex: 'idrol', key: 'idrol', width: 70 },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    {
      title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion',
      ellipsis: true, render: (v: string) => v || '-'
    },
    {
      title: 'Permisos', dataIndex: 'permisos', key: 'permisos',
      render: (permisos: number[]) => (
        <Space size={4} wrap>
          {permisos.map((p) => {
            const perm = permissions.find((x) => x.idpermiso === p);
            return (
              <Tag key={p} color="blue">
                {perm?.nombre || `ID ${p}`}
              </Tag>
            );
          })}
        </Space>
      )
    },
    {
      title: 'Acciones', key: 'acciones', width: 120,
      render: (_: any, record: IRol) => (
        <Space>
          <Tooltip title="Editar rol">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar este rol?"
            description="Los usuarios asignados a este rol quedarán sin rol."
            onConfirm={() => handleDelete(record.idrol)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar rol">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Roles</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nuevo Rol
        </Button>
      </div>

      <Table
        dataSource={items}
        columns={columns}
        rowKey="idrol"
        loading={loading}
        pagination={{ pageSize: 10, responsive: true }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />

      <RoleForm
        open={modalOpen}
        editing={editing}
        permissions={permissions}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
};
