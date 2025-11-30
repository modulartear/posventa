import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Package, CreditCard, DollarSign, Banknote, ShoppingCart } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { formatCurrency } from '../../lib/utils';

export default function Dashboard() {
  const { products, cashRegisters, sales } = useAdmin();

  const activeRegisters = cashRegisters.filter((r) => r.isActive).length;
  const totalProducts = products.length;
  // const totalInventoryValue = products.reduce((sum, p) => sum + p.cashPrice * p.stock, 0);
  const lowStockProducts = products.filter((p) => p.stock < 10).length;

  // Sales statistics
  const totalSales = sales.length;
  const totalCashSales = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
  const totalCardSales = sales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
  const totalRevenue = totalCashSales + totalCardSales;
  const cashSalesCount = sales.filter(s => s.paymentMethod === 'cash').length;
  const cardSalesCount = sales.filter(s => s.paymentMethod === 'card').length;

  const stats = [
    {
      title: 'Total Ventas',
      value: totalSales,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Productos',
      value: totalProducts,
      icon: Package,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Cajas Activas',
      value: `${activeRegisters}/${cashRegisters.length}`,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Vista general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales by Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              Ventas en Efectivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cantidad de ventas</span>
                <span className="text-2xl font-bold">{cashSalesCount}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-muted-foreground">Total recaudado</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCashSales)}
                </span>
              </div>
              {totalRevenue > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Porcentaje del total</span>
                    <span className="font-semibold">
                      {((totalCashSales / totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${(totalCashSales / totalRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Ventas con Tarjeta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cantidad de ventas</span>
                <span className="text-2xl font-bold">{cardSalesCount}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-muted-foreground">Total recaudado</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalCardSales)}
                </span>
              </div>
              {totalRevenue > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Porcentaje del total</span>
                    <span className="font-semibold">
                      {((totalCardSales / totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(totalCardSales / totalRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Cash Registers */}
      <Card>
        <CardHeader>
          <CardTitle>Cajas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          {activeRegisters === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay cajas activas en este momento
            </p>
          ) : (
            <div className="space-y-4">
              {cashRegisters
                .filter((r) => r.isActive)
                .map((register) => (
                  <div
                    key={register.id}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{register.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Responsable: {register.employeeName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Saldo Actual</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(register.currentBalance)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockProducts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">⚠️ Productos con Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products
                .filter((p) => p.stock < 10)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.image}</span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Stock</p>
                      <p className="text-lg font-bold text-orange-600">{product.stock}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
