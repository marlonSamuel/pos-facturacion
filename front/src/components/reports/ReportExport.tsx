import { Button } from 'antd';
import { FilePdfOutlined, TableOutlined } from '@ant-design/icons';

interface Props {
  onExportPdf?: () => void;
  onExportExcel?: () => void;
}

export const ReportExport = ({ onExportPdf, onExportExcel }: Props) => (
  <>
    {onExportPdf && (
      <Button icon={<FilePdfOutlined />} size="small" onClick={onExportPdf}
        style={{ color: '#d4380d', borderColor: '#d4380d', marginRight: 4 }}>
        PDF
      </Button>
    )}
    {onExportExcel && (
      <Button icon={<TableOutlined />} size="small" onClick={onExportExcel}
        style={{ color: '#389e0d', borderColor: '#389e0d' }}>
        Excel
      </Button>
    )}
  </>
);
