import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { X, CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { PaymentResult } from '../services/mercadopago';

interface CardPaymentModalProps {
  amount: number;
  description: string;
  onSuccess: (paymentResult: PaymentResult) => void;
  onCancel: () => void;
}

type PaymentStatus = 'idle' | 'waiting' | 'success' | 'error';

export default function CardPaymentModal({
  amount,
  description,
  onSuccess,
  onCancel,
}: CardPaymentModalProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const handleStartPayment = () => {
    // Simply move to waiting state for manual confirmation
    setStatus('waiting');
  };

  const handleConfirmPayment = () => {
    // Manual confirmation - mark as success
    const result: PaymentResult = {
      success: true,
      paymentId: `manual_${Date.now()}`,
      status: 'APPROVED',
      amount: amount,
    };
    
    setPaymentResult(result);
    setStatus('success');
    
    setTimeout(() => {
      onSuccess(result);
    }, 1500);
  };

  const handleRetry = () => {
    setStatus('idle');
    setPaymentResult(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pago con Tarjeta
          </CardTitle>
          {status === 'idle' && (
            <button
              onClick={onCancel}
              className="rounded-full p-2 hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amount Display */}
          <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary text-center">
            <p className="text-sm text-muted-foreground mb-1">Monto a cobrar</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{formatCurrency(amount)}</p>
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          </div>

          {/* Status Messages */}
          {status === 'idle' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CreditCard className="h-16 w-16 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-2">Listo para procesar el pago</p>
                <p className="text-sm text-muted-foreground">
                  Al confirmar, se enviará el cobro al posnet de MercadoPago
                </p>
              </div>
            </div>
          )}

          {status === 'waiting' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-medium mb-2">Esperando confirmación del pago...</p>
                <p className="text-sm text-muted-foreground">
                  El cliente debe pagar con su tarjeta en el posnet físico
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-green-700 mb-2">¡Pago aprobado!</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(amount)} cobrado exitosamente
                </p>
                {paymentResult?.paymentId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ID: {paymentResult.paymentId}
                  </p>
                )}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-red-700 mb-2">Error en el pago</p>
                <p className="text-muted-foreground">Esperando confirmación del pago...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  El cliente debe pagar con su tarjeta en el posnet físico
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {status === 'idle' && (
              <>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleStartPayment}
                  className="flex-1 gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Enviar al Posnet
                </Button>
              </>
            )}

            {status === 'waiting' && (
              <>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  className="flex-1"
                >
                  Confirmar Pago
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRetry}
                  className="flex-1"
                >
                  Reintentar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
