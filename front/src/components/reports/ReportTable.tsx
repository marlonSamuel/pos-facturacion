import { Table, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface Props {
  columns: ColumnsType<any>;
  data: any[];
  rowKey: string;
  loading: boolean;
  footerContent?: React.ReactNode;
  pageSize?: number;
}

export const ReportTable = ({ columns, data, rowKey, loading, footerContent, pageSize = 20 }: Props) => (
  <Spin spinning={loading}>
    <Table
      dataSource={data}
      columns={columns}
      rowKey={rowKey}
      size="small"
      pagination={{ pageSize }}
      footer={footerContent ? () => footerContent : undefined}
      style={{ fontSize: 13, tableLayout: 'auto' }}
    />
  </Spin>
);
