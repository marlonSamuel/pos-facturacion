declare module 'react-barcode' {
  interface BarcodeProps {
    value: string;
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
  }
  const Barcode: React.FC<BarcodeProps>;
  export default Barcode;
}
