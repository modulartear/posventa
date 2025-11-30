import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useAdmin } from '../../contexts/AdminContext';
import { formatCurrency } from '../../lib/utils';
import { DollarSign, CreditCard, TrendingUp, Store, Banknote, X, Package, Archive } from 'lucide-react';
import Button from '../Button';
import { CashRegister } from '../../types';
import ArchivedHistory from './ArchivedHistory';

export default function SalesHistory() {
  const { sessions, cashRegisters, sales } = useAdmin();
  const [selectedRegister, setSelectedRegister] = useState<string>('all');
  const [detailModalRegister, setDetailModalRegister] = useState<CashRegister | null>(null);
  const [showArchivedHistory, setShowArchivedHistory] = useState(false);

  const filteredSessions = selectedRegister === 'all' 
    ? sessions 
    : sessions.filter(s => s.cashRegisterId === selectedRegister);

  // Filter sales by selected register
  const filteredSales = selectedRegister === 'all'
    ? sales
    : sales.filter(s => s.cashRegisterId === selectedRegister);

  // Statistics
  const totalSales = filteredSessions.reduce((sum, s) => sum + s.totalSales, 0);
  const totalRevenue = filteredSessions.reduce((sum, s) => sum + s.totalCash + s.totalCard, 0);
  const totalCash = filteredSessions.reduce((sum, s) => sum + s.totalCash, 0);
  const totalCard = filteredSessions.reduce((sum, s) => sum + s.totalCard, 0);

  // Statistics by cash register
  const salesByCashRegister = cashRegisters.map(register => {
    const registerSessions = sessions.filter(s => s.cashRegisterId === register.id);
    const totalSales = registerSessions.reduce((sum, s) => sum + s.totalSales, 0);
    const totalCash = registerSessions.reduce((sum, s) => sum + s.totalCash, 0);
    const totalCard = registerSessions.reduce((sum, s) => sum + s.totalCard, 0);
    const totalRevenue = totalCash + totalCard;
    
    return {
      register,
      totalSales,
      totalCash,
      totalCard,
      totalRevenue,
      sessionsCount: registerSessions.length,
    };
  }).filter(item => item.totalSales > 0); // Only show registers with sales


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Historial de Ventas</h2>
          <p className="text-muted-foreground">Consulta las sesiones y ventas realizadas</p>
        </div>
        <Button
          onClick={() => setShowArchivedHistory(true)}
          variant="outline"
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          Historial Archivado
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-medium">Filtrar por caja:</label>
            <select
              value={selectedRegister}
              onChange={(e) => setSelectedRegister(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todas las cajas</option>
              {cashRegisters.map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name}
                </option>
              ))}
            </select>
            {selectedRegister !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRegister('all')}
              >
                Ver todas las cajas
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-bold">{totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efectivo</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCash)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tarjeta</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCard)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Sales Table - Only when filtering by specific register */}
      {selectedRegister !== 'all' && filteredSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ventas Individuales - {cashRegisters.find(r => r.id === selectedRegister)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Fecha</th>
                    <th className="text-left p-3 font-semibold">Productos</th>
                    <th className="text-left p-3 font-semibold">Método Pago</th>
                    <th className="text-right p-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {sale.date.toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {sale.items.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              {item.quantity}x {item.name} @ {formatCurrency(item.appliedPrice)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          sale.paymentMethod === 'cash' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {sale.paymentMethod === 'cash' ? (
                            <><Banknote className="h-3 w-3" /> Efectivo</>
                          ) : (
                            <><CreditCard className="h-3 w-3" /> Tarjeta</>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={3} className="p-3 text-right">Total:</td>
                    <td className="p-3 text-right">{formatCurrency(totalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales by Cash Register */}
      {selectedRegister === 'all' && salesByCashRegister.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Ventas por Caja</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesByCashRegister.map(({ register, totalSales, totalCash, totalCard, totalRevenue, sessionsCount }) => (
              <Card key={register.id} className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="h-5 w-5 text-primary" />
                    {register.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total ventas</span>
                    <span className="font-bold">{totalSales}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sesiones</span>
                    <span className="font-bold">{sessionsCount}</span>
                  </div>
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Efectivo</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(totalCash)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Tarjeta</span>
                      </div>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(totalCard)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(totalRevenue)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setDetailModalRegister(register)}
                  >
                    Ver detalle
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {detailModalRegister && (
        <ProductDetailModal
          register={detailModalRegister}
          sessions={sessions.filter(s => s.cashRegisterId === detailModalRegister.id)}
          sales={sales.filter(s => s.cashRegisterId === detailModalRegister.id)}
          onClose={() => setDetailModalRegister(null)}
        />
      )}

      {/* Archived History Modal */}
      {showArchivedHistory && (
        <ArchivedHistory
          onClose={() => setShowArchivedHistory(false)}
        />
      )}
    </div>
  );
}

// Product Detail Modal Component
interface ProductDetailModalProps {
  register: CashRegister;
  sessions: any[];
  sales: any[];
  onClose: () => void;
}

function ProductDetailModal({ register, sales, onClose }: ProductDetailModalProps) {
  // Group products by name and payment method
  interface ProductStats {
    name: string;
    totalQuantity: number;
    cashQuantity: number;
    cardQuantity: number;
    cashAmount: number;
    cardAmount: number;
    totalAmount: number;
  }

  const productStats: { [key: string]: ProductStats } = {};

  sales.forEach(sale => {
    sale.items.forEach((item: any) => {
      if (!productStats[item.name]) {
        productStats[item.name] = {
          name: item.name,
          totalQuantity: 0,
          cashQuantity: 0,
          cardQuantity: 0,
          cashAmount: 0,
          cardAmount: 0,
          totalAmount: 0,
        };
      }

      const itemTotal = item.appliedPrice * item.quantity;
      productStats[item.name].totalQuantity += item.quantity;
      productStats[item.name].totalAmount += itemTotal;

      if (sale.paymentMethod === 'cash') {
        productStats[item.name].cashQuantity += item.quantity;
        productStats[item.name].cashAmount += itemTotal;
      } else {
        productStats[item.name].cardQuantity += item.quantity;
        productStats[item.name].cardAmount += itemTotal;
      }
    });
  });

  const productList = Object.values(productStats).sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalle de Productos - {register.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Productos vendidos agrupados por tipo de pago
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {productList.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay productos vendidos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {productList.map((product) => (
                <Card key={product.name} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cantidad total: <span className="font-semibold">{product.totalQuantity}</span> unidades
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(product.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      {/* Cash */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Banknote className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700">Efectivo</p>
                          <p className="text-xs text-muted-foreground">
                            {product.cashQuantity} unidades
                          </p>
                          <p className="font-semibold text-green-600 mt-1">
                            {formatCurrency(product.cashAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Card */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-700">Tarjeta</p>
                          <p className="text-xs text-muted-foreground">
                            {product.cardQuantity} unidades
                          </p>
                          <p className="font-semibold text-blue-600 mt-1">
                            {formatCurrency(product.cardAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>

        <div className="border-t p-4">
          <Button onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </Card>
    </div>
  );
}
