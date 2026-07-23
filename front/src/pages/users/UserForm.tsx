import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Typography, Row, Col, Upload, message, Tag, Divider } from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { IUser } from '../../interfaces/IUser';
import type { IRol, IPermissionInfo } from '../../interfaces/IRol';
import type { ISucursalInfo } from '../../services/sucursalService';
import type { UploadFile } from 'antd';

const { Text } = Typography;

interface Props {
  open: boolean;
  editing: IUser | null;
  roles: IRol[];
  permissions: IPermissionInfo[];
  sucursales: ISucursalInfo[];
  onOk: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

export const UserForm = ({ open, editing, roles, permissions, sucursales, onOk, onCancel }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedRol, setSelectedRol] = useState<IRol | null>(null);

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          ...editing,
          idrol: editing.idrol ?? null,
          sucursales: editing.sucursales || [],
        });
        const rol = roles.find(r => r.idrol === editing.idrol);
        setSelectedRol(rol || null);
        // Mostrar imagen actual si existe
        if (editing.imagen && editing.imagen !== 'default.png') {
          setFileList([{
            uid: '-1',
            name: 'imagen',
            status: 'done',
            url: `${API_URL}/uploads/users/${editing.imagen}`
          }]);
        } else {
          setFileList([]);
        }
      } else {
        form.resetFields();
        form.setFieldsValue({ tipo_documento: 'DPI' });
        setFileList([]);
        setSelectedRol(null);
      }
    }
  }, [open, editing, roles]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k !== 'imagen') {
          if (k === 'sucursales' && Array.isArray(v)) {
            v.forEach((s: number) => formData.append('sucursales', String(s)));
          } else {
            formData.append(k, String(v ?? ''));
          }
        }
      });
      if (fileList[0]?.originFileObj) {
        formData.append('imagen', fileList[0].originFileObj);
      }
      setLoading(true);
      await onOk(formData);
      form.resetFields();
      setFileList([]);
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Solo imágenes (jpg, png, gif, webp)');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('La imagen debe ser menor a 2MB');
      return Upload.LIST_IGNORE;
    }
    return false; // prevenimos upload automático, se envía en el form
  };

  return (
    <Modal
      title={editing ? `Editar Usuario: ${editing.nombre}` : 'Nuevo Usuario'}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); setFileList([]); onCancel(); }}
      okText={editing ? 'Actualizar' : 'Crear'}
      confirmLoading={loading}
      destroyOnHidden
      width={720}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Requerido' }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="tipo_documento" label="Tipo Doc." rules={[{ required: true, message: 'Requerido' }]}>
              <Select options={[
                { value: 'DPI', label: 'DPI' },
                { value: 'NIT', label: 'NIT' },
                { value: 'CF', label: 'CF' }
              ]} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="num_documento" label="No. Documento" rules={[{ required: true, message: 'Requerido' }]}>
              <Input />
            </Form.Item>
          </Col>
          {!editing ? (
            <Col xs={24} md={12}>
              <Form.Item name="login" label="Login" rules={[{ required: true, message: 'Requerido' }]}>
                <Input />
              </Form.Item>
            </Col>
          ) : (
            <Col xs={24} md={12}>
              <Form.Item label="Login">
                <Input value={editing?.login} disabled />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Row gutter={16}>
          {!editing && (
            <Col xs={24} md={12}>
              <Form.Item
                name="clave"
                label="Contraseña"
                rules={[{ required: true, message: 'Requerida' }]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} md={editing ? 12 : 6}>
            <Form.Item name="telefono" label="Teléfono">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={editing ? 12 : 6}>
            <Form.Item name="email" label="Email">
              <Input type="email" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="direccion" label="Dirección">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Foto">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList: fl }) => setFileList(fl)}
                beforeUpload={beforeUpload}
                maxCount={1}
                accept="image/*"
                showUploadList={{ showPreviewIcon: false }}
              >
                {fileList.length < 1 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 4, fontSize: 12 }}>Foto</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="idrol" label="Rol" rules={[{ required: true, message: 'Seleccione un rol' }]}>
          <Select
            placeholder="Seleccionar rol"
            allowClear
            showSearch
            optionFilterProp="label"
            onChange={(val) => {
              const rol = roles.find(r => r.idrol === val) || null;
              setSelectedRol(rol);
            }}
            options={roles.map((r) => ({
              value: r.idrol,
              label: r.nombre
            }))}
          />
        </Form.Item>
        {selectedRol && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f6f8fa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              <InfoCircleOutlined style={{ marginRight: 6 }} />
              Módulos del rol: <Text strong style={{ color: '#1677ff' }}>{selectedRol.nombre}</Text>
            </Text>
            <div>
              {selectedRol.permisos.length > 0
                ? selectedRol.permisos.map(pid => {
                    const p = permissions.find(p => p.idpermiso === pid);
                    return <Tag key={pid} color="purple" style={{ marginBottom: 4 }}>{p?.nombre || `#${pid}`}</Tag>;
                  })
                : <Text type="secondary">Sin permisos asignados</Text>
              }
            </div>
          </div>
        )}
        {roles.length === 0 && (
          <Text type="secondary">Cargando roles...</Text>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <Form.Item name="sucursales" label="Sucursales asignadas" rules={[{ required: true, message: 'Seleccione al menos una sucursal' }]}>
          <Select
            mode="multiple"
            placeholder="Seleccionar sucursales"
            allowClear
            options={sucursales.map(s => ({
              value: s.idsucursal,
              label: s.nombre
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
