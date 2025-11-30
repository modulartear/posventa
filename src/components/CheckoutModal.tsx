import { useState } from 'react';
import { CartItem, SelectedCustomer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { formatCurrency } from '@/lib/utils';
import { X, CreditCard, Banknote, QrCode, Users } from 'lucide-react';
import CardPaymentModal from './CardPaymentModal';
import QRPaymentModal from './QRPaymentModal';
import CustomerSelectorModal from './CustomerSelectorModal';

interface CheckoutModalProps {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onConfirm: (paymentMethod: 'cash' | 'card' | 'qr', receivedAmount?: number, customer?: SelectedCustomer) => void;
}

export default function CheckoutModal({ items, total, onClose, onConfirm }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);

  const change = receivedAmount ? parseFloat(receivedAmount) - total : 0;

  const handleConfirm = () => {
    if (paymentMethod === 'cash') {
      if (change < 0) {
        alert('El monto recibido es insuficiente');
        return;
      }
      const amount = receivedAmount ? parseFloat(receivedAmount) : undefined;
      onConfirm(paymentMethod, amount, selectedCustomer || undefined);
    } else if (paymentMethod === 'card') {
      // Card payment - open MercadoPago Point modal
      setShowCardPayment(true);
    } else if (paymentMethod === 'qr') {
      // QR payment - open QR modal
      setShowQRPayment(true);
    }
  };

  const handleCardPaymentSuccess = () => {
    // Payment successful, confirm the sale
    onConfirm(paymentMethod, undefined, selectedCustomer || undefined);
    setShowCardPayment(false);
  };

  const handleCardPaymentCancel = () => {
    setShowCardPayment(false);
  };

  const handleQRPaymentSuccess = () => {
    // Payment successful, confirm the sale
    onConfirm(paymentMethod, undefined, selectedCustomer || undefined);
    setShowQRPayment(false);
  };

  const handleQRPaymentCancel = () => {
    setShowQRPayment(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Procesar Pago</CardTitle>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Items Summary */}
          <div>
            <h3 className="font-semibold mb-3">Resumen de Compra</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.appliedPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Customer Section */}
          <div>
            <h3 className="font-semibold mb-3">Cliente (Opcional)</h3>
            {selectedCustomer ? (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{selectedCustomer.customer.name || 'Cliente sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">
                      Puntos: {selectedCustomer.points?.pointsBalance ?? 0}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Quitar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowCustomerSelector(true)}
                className="w-full gap-2"
              >
                <Users className="h-4 w-4" />
                Agregar cliente para puntos
              </Button>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-semibold mb-3">Método de Pago</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Banknote className="h-8 w-8 mx-auto mb-2" />
                <span className="block text-sm font-medium">Efectivo</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CreditCard className="h-8 w-8 mx-auto mb-2" />
                <span className="block text-sm font-medium">Tarjeta</span>
              </button>
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'qr'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <QrCode className="h-8 w-8 mx-auto mb-2" />
                <span className="block text-sm font-medium">QR</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium mb-2">Monto Recibido</label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
              {receivedAmount && (
                <div className="mt-3 p-3 bg-secondary rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Cambio:</span>
                    <span
                      className={`font-bold ${change < 0 ? 'text-destructive' : 'text-green-600'}`}
                    >
                      {formatCurrency(Math.max(0, change))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Confirmar Pago
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card Payment Modal */}
      {showCardPayment && (
        <CardPaymentModal
          amount={total}
          description={`Venta de ${items.length} producto${items.length > 1 ? 's' : ''}`}
          onSuccess={handleCardPaymentSuccess}
          onCancel={handleCardPaymentCancel}
        />
      )}

      {/* QR Payment Modal */}
      {showQRPayment && (
        <QRPaymentModal
          amount={total}
          description={`Venta de ${items.length} producto${items.length > 1 ? 's' : ''}`}
          onSuccess={handleQRPaymentSuccess}
          onCancel={handleQRPaymentCancel}
        />
      )}

      {/* Customer Selector Modal */}
      {showCustomerSelector && (
        <CustomerSelectorModal
          onClose={() => setShowCustomerSelector(false)}
          onSelect={(customer) => {
            setSelectedCustomer(customer);
            setShowCustomerSelector(false);
          }}
        />
      )}
    </div>
  );
}
