declare module 'react-barcode-reader' {
  interface BarcodeReaderProps {
    onScan: (data: string) => void;
    onError?: (error: any) => void;
    onLoad?: () => void;
    minDelay?: number;
    maxDelay?: number;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    keyboard?: boolean;
    scannerEnabled?: boolean;
  }

  export default function BarcodeReader(props: BarcodeReaderProps): JSX.Element;
}