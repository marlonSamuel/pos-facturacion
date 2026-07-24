import { Modal, Descriptions, Table, Tag, Typography, Divider, Spin } from 'antd';
import type { IPurchase } from '../../interfaces/IPurchase';

const { Text } = Typography;

interface Props {
  open: boolean;
  data: IPurchase | null;
  loading: boolean;
  onCancel: () => void;
}

export const PurchaseDetail = ({ open, data, loading, onCancel }: Props) => {
  const detColumns = [
    { title: 'Artículo', dataIndex: 'articulo', key: 'articulo' },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad', width: 90 },
    { title: 'P. Compra', dataIndex: 'precio_compra', key: 'precio_compra', width: 110,
      render: (v: number) => `Q${Number(v).toFixed(2)}` },
    { title: 'Subtotal', key: 'subtotal', width: 110,
      render: (_: any, r: any) => `Q${(r.cantidad * r.precio_compra).toFixed(2)}` }
  ];

  return (
    <Modal
      title={`Compra #${data?.idingreso || ''}`}
      open={open}
      onCancel={onCancel}
      footer={false}
      width={720}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {data && (
          <>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
              <Descriptions.Item label="Proveedor">{data.proveedor || '—'}</Descriptions.Item>
              <Descriptions.Item label="Usuario">{data.usuario || '—'}</Descriptions.Item>
              <Descriptions.Item label="Comprobante">
                {data.tipo_comprobante} {data.serie_comprobante || ''}-{data.num_comprobante}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha">{new Date(data.fecha_hora).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={data.estado === 'Aceptado' ? 'green' : 'red'}>{data.estado}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <Text strong>Q{Number(data.total_compra).toFixed(2)}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Artículos</Divider>

            <Table
              dataSource={data.detalles || []}
              columns={detColumns}
              rowKey="iddetalle_ingreso"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <Text strong>Total:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>Q{Number(data.total_compra).toFixed(2)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </>
        )}
      </Spin>
    </Modal>
  );
};
