import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { AlertCircle, Camera, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  buttonLabel?: string;
  className?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | null;
  autoClose?: boolean;
}

export function BarcodeScanner({ 
  onScan, 
  buttonLabel = "Escanear Código de Barras", 
  className,
  buttonVariant = 'default',
  autoClose = true
}: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resetar o estado quando o diálogo for fechado
  useEffect(() => {
    if (!open) {
      setScanned(false);
      setBarcode('');
      setError('');
      
      // Parar o scanner quando o modal for fechado
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    } else {
      // Iniciar o scanner quando o modal for aberto
      startScanner();
    }

    // Cleanup ao desmontar o componente
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [open]);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }

      const scanner = new Html5Qrcode(containerRef.current.id);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await scanner.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => handleScan(decodedText),
        (errorMessage) => {
          // Ignorar erros de decodificação, são comuns durante a busca
          if (!errorMessage.includes("No QR code found")) {
            console.error(errorMessage);
          }
        }
      );
    } catch (err: any) {
      console.error('Erro ao iniciar scanner:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  };

  const handleScan = (data: string) => {
    if (data && !scanned) {
      setBarcode(data);
      setScanned(true);
      setError('');
      
      // Chamar o callback com o código de barras escaneado
      onScan(data);
      
      // Fechar o diálogo automaticamente após o escaneamento bem-sucedido
      if (autoClose) {
        setTimeout(() => {
          setOpen(false);
        }, 1000);
      }

      // Parar o scanner após o sucesso
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    }
  };

  const handleSubmit = () => {
    if (barcode) {
      onScan(barcode);
      setOpen(false);
    }
  };

  // ID único para o container do scanner
  const scannerId = `qr-reader-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={cn("gap-2", className)}>
          <Camera className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Código de Barras</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="relative">
          {!scanned ? (
            <div className="w-full aspect-video relative border rounded-md overflow-hidden bg-muted/50">
              {/* O container do scanner precisa de um ID para o html5-qrcode */}
              <div 
                id={scannerId} 
                ref={containerRef}
                className="w-full h-full"
              ></div>
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                {/* Moldura de escaneamento */}
                <div className="w-64 h-64 border-2 border-dashed border-primary rounded-md flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground text-sm text-center p-4">
                    Posicione o código de barras dentro desta área
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="pt-6 flex items-center gap-2">
                <div className="bg-primary/20 text-primary rounded-full p-1">
                  <Check className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium">Código lido com sucesso</p>
                  <p className="text-xs text-muted-foreground text-ellipsis overflow-hidden">{barcode}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          {!autoClose && scanned && (
            <Button onClick={handleSubmit}>
              Confirmar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}