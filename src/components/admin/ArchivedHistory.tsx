import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { X, Calendar, Archive, Package } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useAdmin } from '../../contexts/AdminContext';
import { Sale, CashRegisterSession } from '../../types';

interface ArchivedHistoryProps {
  onClose: () => void;
}

export default function ArchivedHistory({ onClose }: ArchivedHistoryProps) {
  const { loadArchivedData, cashRegisters } = useAdmin();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedRegister, setSelectedRegister] = useState<string>('all');
  const [archivedSales, setArchivedSales] = useState<Sale[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<CashRegisterSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      alert('Por favor selecciona ambas fechas');
      return;
    }

    setLoading(true);
    try {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');

      console.log('Buscando archivados entre:', start, 'y', end);
      const data = await loadArchivedData(start, end);
      console.log('Datos encontrados:', data);
      setArchivedSales(data.sales);
      setArchivedSessions(data.sessions);
    } catch (error) {
      console.error('Error loading archived data:', error);
      alert('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAll = async () => {
    setLoading(true);
    try {
      console.log('Cargando todos los datos archivados...');
      const data = await loadArchivedData();
      console.log('Datos encontrados:', data);
      setArchivedSales(data.sales);
      setArchivedSessions(data.sessions);
      setStartDate('');
      setEndDate('');
    } catch (error) {
      console.error('Error loading archived data:', error);
      alert('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  // Filter by cash register
  const filteredSales = selectedRegister === 'all'
    ? archivedSales
    : archivedSales.filter(s => s.cashRegisterId === selectedRegister);

  // const filteredSessions = selectedRegister === 'all'
  //   ? archivedSessions
  //   : archivedSessions.filter(s => s.cashRegisterId === selectedRegister);

  // Calculate totals
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalCash = filteredSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
  const totalCard = filteredSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);

  // Group products
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

  filteredSales.forEach(sale => {
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
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Historial Archivado
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Consulta ventas y sesiones archivadas por fecha
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Filters */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-4 space-y-4">
              {/* Date Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Buscando...' : 'Buscar'}
                  </Button>
                  <Button
                    onClick={handleLoadAll}
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    Cargar Todo
                  </Button>
                </div>
              </div>

              {/* Cash Register Filter */}
              {(archivedSales.length > 0 || archivedSessions.length > 0) && (
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-2">
                    Filtrar por Caja:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedRegister}
                      onChange={(e) => setSelectedRegister(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                        Ver todas
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {archivedSales.length > 0 && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Ventas</p>
                    <p className="text-2xl font-bold">{totalSales}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Efectivo</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCash)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Tarjeta</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCard)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Toggle Product Detail */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowProductDetail(!showProductDetail)}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  {showProductDetail ? 'Ocultar' : 'Ver'} Detalle de Productos
                </Button>
              </div>

              {/* Product Detail */}
              {showProductDetail && productList.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Productos Vendidos</h3>
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
                          <div>
                            <p className="text-sm font-medium text-green-700">💵 Efectivo</p>
                            <p className="text-xs text-muted-foreground">{product.cashQuantity} unidades</p>
                            <p className="font-semibold text-green-600">{formatCurrency(product.cashAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-700">💳 Tarjeta</p>
                            <p className="text-xs text-muted-foreground">{product.cardQuantity} unidades</p>
                            <p className="font-semibold text-blue-600">{formatCurrency(product.cardAmount)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Sessions Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Sesiones ({archivedSessions.length})</h3>
                <div className="text-sm text-muted-foreground">
                  {archivedSessions.length} sesiones archivadas en el período seleccionado
                </div>
              </div>
            </>
          )}

          {archivedSales.length === 0 && !loading && startDate && endDate && (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No se encontraron datos archivados en el período seleccionado
              </p>
            </div>
          )}
        </CardContent>

        <div className="border-t p-4">
          <Button onClick={onClose} variant="outline" className="w-full">
            Cerrar
          </Button>
        </div>
      </Card>
    </div>
  );
}
