import { useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useUser } from '../../hooks/useUser';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { ChangePasswordModal } from './ChangePasswordModal';
import { sucursalService } from '../../services/sucursalService';
import { userService } from '../../services/userService';
import type { IUser } from '../../interfaces/IUser';
import type { IPermissionInfo } from '../../interfaces/IRol';
import type { ISucursalInfo } from '../../services/sucursalService';

const { Title } = Typography;

export const IndexUser = () => {
  const { items, loading, roles, getAll, getRoles, create, update, toggleStatus } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IUser | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; user: IUser | null }>({ open: false, user: null });
  const [sucursales, setSucursales] = useState<ISucursalInfo[]>([]);
  const [permissions, setPermissions] = useState<IPermissionInfo[]>([]);

  useEffect(() => {
    getAll();
    getRoles();
    sucursalService.getAll().then(setSucursales).catch(() => {});
    userService.getPermissions().then(setPermissions).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (record: IUser) => { setEditing(record); setModalOpen(true); };
  const openPassword = (record: IUser) => { setPasswordModal({ open: true, user: record }); };

  const handleOk = async (formData: FormData) => {
    let ok = false;
    if (editing) {
      ok = await update(editing.idusuario, formData);
    } else {
      ok = await create(formData);
    }
    if (ok) setModalOpen(false);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Usuarios</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nuevo Usuario
        </Button>
      </div>

      <UserList
        items={items}
        loading={loading}
        sucursales={sucursales}
        onEdit={openEdit}
        onToggleStatus={toggleStatus}
        onChangePassword={openPassword}
      />

      <UserForm
        open={modalOpen}
        editing={editing}
        roles={roles}
        permissions={permissions}
        sucursales={sucursales}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      />

      {passwordModal.user && (
        <ChangePasswordModal
          open={passwordModal.open}
          userId={passwordModal.user.idusuario}
          userName={passwordModal.user.nombre}
          onCancel={() => setPasswordModal({ open: false, user: null })}
        />
      )}
    </>
  );
};
