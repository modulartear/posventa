import { Product } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { X, CreditCard, Banknote, Plus, Minus, ShoppingBag, QrCode } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useState } from 'react';
import CardPaymentModal from './CardPaymentModal';
import QRPaymentModal from './QRPaymentModal';

interface ProductSelectionModalProps {
  product: Product;
  onConfirm: (quantity: number, paymentMethod: 'cash' | 'card' | 'qr', receivedAmount?: number) => void;
  onClose: () => void;
}

export default function ProductSelectionModal({ 
  product, 
  onConfirm, 
  onClose 
}: ProductSelectionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);

  const selectedPrice = paymentMethod === 'cash' ? product.cashPrice : product.cardPrice;
  const total = selectedPrice * quantity;

  const handleConfirm = () => {
    if (paymentMethod === 'cash') {
      const received = parseFloat(receivedAmount);
      if (!receivedAmount || isNaN(received) || received < total) {
        alert('Por favor ingresa un monto válido mayor o igual al total');
        return;
      }
      onConfirm(quantity, paymentMethod, received);
      onClose();
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
    onConfirm(quantity, paymentMethod);
    setShowCardPayment(false);
    onClose();
  };

  const handleCardPaymentCancel = () => {
    setShowCardPayment(false);
  };

  const handleQRPaymentSuccess = () => {
    // Payment successful, confirm the sale
    onConfirm(quantity, paymentMethod);
    setShowQRPayment(false);
    onClose();
  };

  const handleQRPaymentCancel = () => {
    setShowQRPayment(false);
  };


  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Procesar Venta
          </CardTitle>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
            <div className="text-3xl sm:text-4xl">{product.image}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.category}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Stock disponible: {product.stock}
              </p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Cantidad</label>
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="text-2xl sm:text-3xl font-bold w-12 sm:w-16 text-center">{quantity}</span>
              <button
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
                className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-3">Método de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className={`h-8 w-8 mx-auto mb-2 ${
                  paymentMethod === 'cash' ? 'text-primary' : 'text-gray-400'
                }`} />
                <p className="font-medium text-sm">Efectivo</p>
                <p className="text-base sm:text-lg font-bold mt-1">{formatCurrency(product.cashPrice)}</p>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className={`h-8 w-8 mx-auto mb-2 ${
                  paymentMethod === 'card' ? 'text-primary' : 'text-gray-400'
                }`} />
                <p className="font-medium text-sm">Tarjeta</p>
                <p className="text-base sm:text-lg font-bold mt-1">{formatCurrency(product.cardPrice)}</p>
              </button>
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'qr'
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <QrCode className={`h-8 w-8 mx-auto mb-2 ${
                  paymentMethod === 'qr' ? 'text-primary' : 'text-gray-400'
                }`} />
                <p className="font-medium text-sm">QR</p>
                <p className="text-base sm:text-lg font-bold mt-1">{formatCurrency(product.cardPrice)}</p>
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-medium">Total a Pagar:</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {quantity} × {formatCurrency(selectedPrice)}
            </p>
          </div>

          {/* Cash Payment Input */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium mb-2">Monto Recibido</label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="Ingresa el monto recibido"
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                step="0.01"
                min={total}
              />
              {receivedAmount && parseFloat(receivedAmount) >= total && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Cambio:</span>
                    <span className="text-lg font-bold text-green-800">
                      {formatCurrency(parseFloat(receivedAmount) - total)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Confirmar Venta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card Payment Modal */}
      {showCardPayment && (
        <CardPaymentModal
          amount={total}
          description={`${product.name} x${quantity}`}
          onSuccess={handleCardPaymentSuccess}
          onCancel={handleCardPaymentCancel}
        />
      )}

      {/* QR Payment Modal */}
      {showQRPayment && (
        <QRPaymentModal
          amount={total}
          description={`${product.name} x${quantity}`}
          onSuccess={handleQRPaymentSuccess}
          onCancel={handleQRPaymentCancel}
        />
      )}
    </div>
  );
}
