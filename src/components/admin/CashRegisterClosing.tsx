import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { X, DollarSign, CreditCard as CardIcon, ShoppingCart } from 'lucide-react';
import { CashRegister } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useAdmin } from '../../contexts/AdminContext';

interface CashRegisterClosingProps {
  cashRegister: CashRegister;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CashRegisterClosing({ cashRegister, onClose, onConfirm }: CashRegisterClosingProps) {
  const { getOpenSession, closeSession, sales, sessions } = useAdmin();
  const [closingBalance, setClosingBalance] = useState<string>('');
  const session = getOpenSession(cashRegister.id);

  console.log('=== CashRegisterClosing Debug ===');
  console.log('Cash Register ID:', cashRegister.id);
  console.log('All Sessions:', sessions);
  console.log('Open Sessions:', sessions.filter(s => s.status === 'open'));
  console.log('Sessions for this register:', sessions.filter(s => s.cashRegisterId === cashRegister.id));
  console.log('Found Session:', session);

  if (!session) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-center mb-4">No se encontró una sesión activa para esta caja.</p>
              <div className="text-xs text-left bg-gray-100 p-3 rounded">
                <p><strong>Debug Info:</strong></p>
                <p>Caja ID: {cashRegister.id}</p>
                <p>Total sesiones: {sessions.length}</p>
                <p>Sesiones abiertas: {sessions.filter(s => s.status === 'open').length}</p>
                <p>Sesiones de esta caja: {sessions.filter(s => s.cashRegisterId === cashRegister.id).length}</p>
              </div>
              <Button onClick={onClose} className="w-full">Cerrar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate session sales in real-time
  const sessionSales = sales.filter(s => 
    s.cashRegisterId === cashRegister.id && 
    new Date(s.date) >= new Date(session.openedAt)
  );

  const totalSales = sessionSales.length;
  const totalCash = sessionSales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);
  const totalCard = sessionSales
    .filter(s => s.paymentMethod === 'card')
    .reduce((sum, s) => sum + s.total, 0);
  const expectedBalance = session.openingBalance + totalCash;

  const handleClose = async () => {
    const balance = parseFloat(closingBalance);
    if (isNaN(balance) || balance < 0) {
      alert('Por favor ingresa un saldo de cierre válido');
      return;
    }

    await closeSession(cashRegister.id, balance);
    onConfirm();
  };


  const difference = closingBalance ? parseFloat(closingBalance) - expectedBalance : 0;

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-3xl my-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cierre de Caja - {cashRegister.name}</CardTitle>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Cajero</p>
              <p className="font-semibold">{session.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Apertura</p>
              <p className="font-semibold">
                {new Date(session.openedAt).toLocaleString('es-AR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Inicial</p>
              <p className="font-semibold text-base sm:text-lg">{formatCurrency(session.openingBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duración</p>
              <p className="font-semibold">
                {Math.floor((Date.now() - new Date(session.openedAt).getTime()) / 3600000)}h
              </p>
            </div>
          </div>

          {/* Sales Summary */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Resumen de Ventas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Ventas</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalSales}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-muted-foreground">Efectivo</p>
                  </div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                    {formatCurrency(totalCash)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CardIcon className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Tarjeta</p>
                  </div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                    {formatCurrency(totalCard)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sales Detail */}
          <div>
            <h3 className="font-semibold mb-3">Detalle de Ventas ({sessionSales.length})</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {sessionSales.map((sale, index) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-medium">
                        {sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.date).toLocaleTimeString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(sale.total)}</p>
                    <p className={`text-xs ${sale.paymentMethod === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>
                      {sale.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Balance */}
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
              <p className="font-medium text-blue-900">Saldo Esperado en Caja</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">
                {formatCurrency(expectedBalance)}
              </p>
            </div>
            <p className="text-sm text-blue-700">
              Saldo inicial ({formatCurrency(session.openingBalance)}) + Ventas en efectivo ({formatCurrency(totalCash)})
            </p>
          </div>

          {/* Closing Balance Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Saldo Real de Cierre *
            </label>
            <input
              type="number"
              step="0.01"
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              placeholder="Ingresa el dinero contado en caja"
            />
            {closingBalance && (
              <div className={`mt-3 p-3 rounded-lg ${
                difference === 0 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : difference > 0
                  ? 'bg-yellow-50 border-2 border-yellow-200'
                  : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {difference === 0 ? '✓ Cuadra perfecto' : difference > 0 ? 'Sobrante' : 'Faltante'}
                  </p>
                  <p className={`text-lg sm:text-xl font-bold ${
                    difference === 0 
                      ? 'text-green-700' 
                      : difference > 0
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {difference !== 0 && (difference > 0 ? '+' : '')}{formatCurrency(Math.abs(difference))}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleClose}
              className="w-full"
              disabled={!closingBalance}
            >
              Confirmar Cierre de Caja
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
