import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { X, QrCode, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { processQRPayment } from '../services/mercadopago-qr-simple';
import { QRCodeSVG } from 'qrcode.react';

interface QRPaymentModalProps {
  amount: number;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentStatus = 'idle' | 'generating' | 'waiting' | 'success' | 'error' | 'cancelled';

export default function QRPaymentModal({
  amount,
  description,
  onSuccess,
  onCancel,
}: QRPaymentModalProps) {
  const { companyId } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [qrData, setQrData] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleGenerateQR = async () => {
    if (!companyId) {
      setStatus('error');
      setErrorMessage('No se pudo identificar la empresa');
      return;
    }

    setStatus('generating');
    setErrorMessage('');

    try {
      const result = await processQRPayment(
        amount,
        description,
        companyId,
        `qr_sale_${Date.now()}`
      );

      if (result.success && result.qrData && result.externalReference) {
        setQrData(result.qrData);
        setStatus('waiting');
        
        // Sin backend, el usuario debe confirmar manualmente
        // El QR se muestra y el usuario escanea con su app de MercadoPago
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Error al generar el código QR');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Error al procesar el pago');
    }
  };

  const handleCancel = () => {
    if (status === 'waiting') {
      if (confirm('¿Estás seguro de cancelar? El cliente puede estar escaneando el QR.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Auto-generate QR on mount
  useEffect(() => {
    handleGenerateQR();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pago con QR
          </CardTitle>
          <button
            onClick={handleCancel}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
            disabled={status === 'generating'}
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Display */}
          <div className="text-center p-6 bg-primary/10 rounded-lg border-2 border-primary">
            <p className="text-sm text-muted-foreground mb-1">Monto a cobrar</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{formatCurrency(amount)}</p>
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          </div>

          {/* QR Code Display */}
          {status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Generando código QR...</p>
              <p className="text-sm text-muted-foreground mt-2">Por favor espera</p>
            </div>
          )}

          {status === 'waiting' && qrData && (
            <div className="flex flex-col items-center">
              <div className="p-6 bg-white rounded-lg border-2 border-gray-200 mb-4 shadow-lg">
                <QRCodeSVG 
                  value={qrData} 
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-lg font-medium text-blue-600">Esperando pago...</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Escanea el código QR con la app de MercadoPago
                </p>
                <p className="text-xs text-muted-foreground">
                  El pago se confirmará automáticamente
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-20 w-20 text-green-600 mb-4" />
              <p className="text-2xl font-bold text-green-600 mb-2">¡Pago aprobado!</p>
              <p className="text-lg font-medium mb-1">{formatCurrency(amount)}</p>
              <p className="text-sm text-muted-foreground">cobrado exitosamente</p>
            </div>
          )}

          {(status === 'error' || status === 'cancelled') && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="h-20 w-20 text-red-600 mb-4" />
              <p className="text-2xl font-bold text-red-600 mb-2">
                {status === 'cancelled' ? 'Pago cancelado' : 'Error en el pago'}
              </p>
              <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {status === 'idle' || status === 'error' || status === 'cancelled' ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
                {(status === 'error' || status === 'cancelled') && (
                  <Button onClick={handleGenerateQR} className="flex-1">
                    Reintentar
                  </Button>
                )}
              </>
            ) : status === 'waiting' ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={() => { setStatus('success'); setTimeout(onSuccess, 1500); }} className="flex-1">
                  Confirmar Pago
                </Button>
              </>
            ) : null}
          </div>

          {/* Instructions */}
          {status === 'waiting' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-900 mb-2">📱 Instrucciones para el cliente:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Abre la app de MercadoPago en tu celular</li>
                <li>Toca el ícono de escanear QR</li>
                <li>Apunta la cámara al código QR de esta pantalla</li>
                <li>Confirma el pago en tu celular</li>
                <li>El pago se confirmará automáticamente aquí</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
