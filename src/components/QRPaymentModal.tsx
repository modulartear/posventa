import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { X, QrCode, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { createPosOrder } from '../services/pos';

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
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleStartPayment = async () => {
    if (!companyId) {
      setStatus('error');
      setErrorMessage('No se pudo identificar la empresa');
      return;
    }

    setStatus('generating');
    setErrorMessage('');

    try {
      const externalReference = `qr_sale_${Date.now()}`;

      console.log('🔵 Enviando orden al POS físico...');
      const result = await createPosOrder({
        amount,
        description,
        externalReference,
        companyId,
      });

      if (!result.success) {
        setStatus('error');
        setErrorMessage(result.error || 'Error al crear orden en el POS');
        return;
      }

      console.log('✅ Orden QR enviada al POS:', result.order?.id);
      setStatus('waiting');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Error al procesar el pago');
    }
  };

  // Enviar automáticamente la orden al POS cuando se abre el modal
  useEffect(() => {
    if (status === 'idle') {
      handleStartPayment();
    }
    // Solo queremos llamarlo una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    if (status === 'waiting') {
      if (confirm('¿Estás seguro de cancelar? El cliente puede estar escaneando el QR.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

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

          {/* Estado de pago en POS */}
          {status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Enviando orden al POS...</p>
              <p className="text-sm text-muted-foreground mt-2">Por favor espera</p>
            </div>
          )}

          {status === 'waiting' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Esperando pago en el POS...</p>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                El cliente puede pagar con tarjeta o QR directamente en el dispositivo físico de MercadoPago.
              </p>
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
                  <Button onClick={handleStartPayment} className="flex-1">
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
        </CardContent>
      </Card>
    </div>
  );
}
