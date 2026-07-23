import { useEffect, useState } from 'react';
import { Modal, Descriptions, Table, Typography, Spin } from 'antd';
import { Button } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { saleService } from '../../services/saleService';
import type { IVenta } from '../../interfaces/ISale';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Props {
  open: boolean;
  saleId: number | null;
  onClose: () => void;
}

export const SaleDetail = ({ open, saleId, onClose }: Props) => {
  const [data, setData] = useState<IVenta | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && saleId) {
      setLoading(true);
      saleService.getById(saleId).then(setData).catch(() => {}).finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [open, saleId]);

  const detailColumns = [
    { title: 'Artículo', dataIndex: 'articulo', key: 'articulo' },
    { title: 'Cant.', dataIndex: 'cantidad', key: 'cantidad', width: 60 },
    { title: 'Precio', dataIndex: 'precio_venta', key: 'precio_venta', width: 100, render: (v: number) => `Q${v.toFixed(2)}` },
    { title: 'Desc.', dataIndex: 'descuento', key: 'descuento', width: 80, render: (v: number) => `Q${v.toFixed(2)}` },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', width: 100, render: (v: number) => `Q${v.toFixed(2)}` }
  ];

  return (
    <Modal
      title={<span style={{ fontSize: 14 }}>Venta #{saleId}</span>}
      open={open}
      onCancel={onClose}
      closable
      closeIcon={<CloseOutlined />}
      footer={
        data?.pdfUrl ? (
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.open(data.pdfUrl, '_blank')}>
            Ver PDF
          </Button>
        ) : null
      }
      width={700}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {data && (
          <>
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Cliente" span={2}>{data.cliente}</Descriptions.Item>
              <Descriptions.Item label="Tipo">{data.tipo_comprobante}</Descriptions.Item>
              <Descriptions.Item label="Pago">{data.tipo_venta === 'CR' ? '📋 Crédito' : '💰 Contado'}</Descriptions.Item>
              <Descriptions.Item label="No. Documento">{data.serie_comprobante ? `${data.serie_comprobante}-${data.num_comprobante}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Fecha">{dayjs(data.fecha_hora).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Text type={data.estado === 'Aceptado' ? 'success' : 'danger'}>{data.estado}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Subtotal">Q{(data.total_venta - data.impuesto).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="IVA">Q{parseFloat(data.impuesto as any).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Total" span={2}>
                <Text strong style={{ fontSize: 16 }}>Q{parseFloat(data.total_venta as any).toFixed(2)}</Text>
              </Descriptions.Item>
              {data.autorizacion && (
                <Descriptions.Item label="Autorización" span={2}>{data.autorizacion}</Descriptions.Item>
              )}
            </Descriptions>

            <Table
              dataSource={data.detalles || []}
              columns={detailColumns}
              rowKey="iddetalle_venta"
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <Text strong>Total:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>Q{parseFloat(data.total_venta as any).toFixed(2)}</Text>
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
