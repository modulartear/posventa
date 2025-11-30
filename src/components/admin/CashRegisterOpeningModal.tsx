import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { X, DollarSign } from 'lucide-react';
import { CashRegister } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface CashRegisterOpeningModalProps {
  cashRegister: CashRegister;
  onClose: () => void;
  onConfirm: (openingBalance: number) => void;
}

export default function CashRegisterOpeningModal({
  cashRegister,
  onClose,
  onConfirm,
}: CashRegisterOpeningModalProps) {
  const [openingBalance, setOpeningBalance] = useState<string>('0');

  const handleConfirm = () => {
    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      alert('Por favor ingresa un saldo de apertura válido');
      return;
    }
    onConfirm(balance);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Abrir Caja - {cashRegister.name}
          </CardTitle>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Cajero:</strong> {cashRegister.employeeName}
            </p>
            <p className="text-xs text-blue-700">
              Se iniciará un nuevo período de caja. Ingresa el saldo inicial con el que comienza el cajero.
            </p>
          </div>

          {/* Opening Balance Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Saldo de Apertura
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                step="0.01"
                min="0"
                autoFocus
              />
            </div>
            {openingBalance && parseFloat(openingBalance) >= 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                La caja iniciará con {formatCurrency(parseFloat(openingBalance))}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Importante:</strong> Este saldo debe coincidir con el dinero físico que tiene el cajero al comenzar.
            </p>
          </div>

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
              <DollarSign className="h-4 w-4" />
              Abrir Caja
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
