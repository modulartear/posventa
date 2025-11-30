import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { Trash2, AlertTriangle, Archive, Package, CheckCircle, Building2, Key, Database, Star } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import CompanySettings from './CompanySettings';
import APISettings from './APISettings';
import LoyaltySettings from './LoyaltySettings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'company' | 'apis' | 'loyalty' | 'data'>('company');
  const { 
    products, 
    employees, 
    cashRegisters, 
    sales,
    sessions,
    clearProducts,
    clearEmployees,
    clearCashRegisters,
    clearSales,
    clearSessions,
  } = useAdmin();

  const [isArchiving, setIsArchiving] = useState(false);

  const [selectedItems, setSelectedItems] = useState({
    products: false,
    employees: false,
    cashRegisters: false,
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dataItems = [
    {
      id: 'products',
      label: 'Productos',
      count: products.length,
      description: 'Eliminar todos los productos del inventario',
      icon: '📦',
    },
    {
      id: 'employees',
      label: 'Empleados',
      count: employees.length,
      description: 'Eliminar todos los empleados registrados',
      icon: '👥',
    },
    {
      id: 'cashRegisters',
      label: 'Cajas',
      count: cashRegisters.length,
      description: 'Eliminar todas las cajas registradoras',
      icon: '💰',
    },
  ];

  const handleToggle = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedItems).every(v => v);
    const newState = !allSelected;
    setSelectedItems({
      products: newState,
      employees: newState,
      cashRegisters: newState,
    });
  };

  const handleArchiveSales = async () => {
    if (!confirm('¿Deseas archivar todas las ventas actuales?\n\nLas ventas se moverán al historial archivado y desaparecerán de la vista actual.')) {
      return;
    }
    setIsArchiving(true);
    try {
      await clearSales();
      alert('✅ Ventas archivadas exitosamente');
    } catch (error) {
      alert('❌ Error al archivar ventas');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveSessions = async () => {
    if (!confirm('¿Deseas archivar todas las sesiones cerradas?\n\nLas sesiones se moverán al historial archivado y desaparecerán de la vista actual.')) {
      return;
    }
    setIsArchiving(true);
    try {
      await clearSessions();
      alert('✅ Sesiones archivadas exitosamente');
    } catch (error) {
      alert('❌ Error al archivar sesiones');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);

    setTimeout(() => {
      if (selectedItems.products) clearProducts();
      if (selectedItems.employees) clearEmployees();
      if (selectedItems.cashRegisters) clearCashRegisters();

      setIsDeleting(false);
      setShowConfirmation(false);
      setSelectedItems({
        products: false,
        employees: false,
        cashRegisters: false,
      });

      alert('✅ Datos eliminados exitosamente');
    }, 1000);
  };

  const selectedCount = Object.values(selectedItems).filter(v => v).length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Configuración</h2>
        <p className="text-muted-foreground">Gestiona los datos del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'company'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Empresa
          </button>
          <button
            onClick={() => setActiveTab('apis')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'apis'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            <Key className="h-4 w-4" />
            APIs
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'loyalty'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            <Star className="h-4 w-4" />
            Lealtad
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            <Database className="h-4 w-4" />
            Datos
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'company' && <CompanySettings />}
      
      {activeTab === 'apis' && <APISettings />}

      {activeTab === 'loyalty' && <LoyaltySettings />}
      
      {activeTab === 'data' && (
        <>
          {/* Archive Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archivar Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">💡 Información</h3>
                <p className="text-sm text-blue-800">
                  Los datos archivados no se eliminan, se mueven al historial archivado donde puedes consultarlos cuando lo necesites.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Archive Sales */}
            <div className="p-4 border-2 rounded-lg hover:border-blue-300 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">🧾</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">Ventas</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Archivar todas las ventas actuales
                  </p>
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                    {sales.length} {sales.length === 1 ? 'venta' : 'ventas'}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleArchiveSales}
                disabled={isArchiving || sales.length === 0}
                className="w-full gap-2"
                variant="outline"
              >
                <Archive className="h-4 w-4" />
                Archivar Ventas
              </Button>
            </div>

            {/* Archive Sessions */}
            <div className="p-4 border-2 rounded-lg hover:border-blue-300 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">📊</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">Sesiones</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Archivar todas las sesiones cerradas
                  </p>
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                    {sessions.filter(s => s.status === 'closed').length} cerradas
                  </span>
                </div>
              </div>
              <Button
                onClick={handleArchiveSessions}
                disabled={isArchiving || sessions.filter(s => s.status === 'closed').length === 0}
                className="w-full gap-2"
                variant="outline"
              >
                <Archive className="h-4 w-4" />
                Archivar Sesiones
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Card */}
      <Card className="border-orange-500 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">⚠️ Advertencia</h3>
              <p className="text-sm text-orange-800">
                La eliminación de datos es <strong>permanente</strong> y no se puede deshacer. 
                Solo elimina productos, empleados o cajas si realmente no los necesitas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Eliminar Datos del Sistema</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {Object.values(selectedItems).every(v => v) ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedItems[item.id as keyof typeof selectedItems]
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems[item.id as keyof typeof selectedItems]}
                  onChange={() => handleToggle(item.id)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{item.icon}</span>
                    <h4 className="font-semibold text-lg">{item.label}</h4>
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                      {item.count} {item.count === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {hasSelection && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">
                    {selectedCount} {selectedCount === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
                  </p>
                  <p className="text-sm text-red-700">
                    Esta acción eliminará permanentemente los datos seleccionados
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowConfirmation(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Datos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Confirmar Eliminación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Estás a punto de eliminar <strong>{selectedCount}</strong> {selectedCount === 1 ? 'categoría' : 'categorías'} de datos:
              </p>
              <ul className="space-y-2">
                {dataItems
                  .filter(item => selectedItems[item.id as keyof typeof selectedItems])
                  .map(item => (
                    <li key={item.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">({item.count} registros)</span>
                    </li>
                  ))}
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Esta acción es irreversible y eliminará permanentemente los datos seleccionados.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirmar Eliminación
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </>
      )}
    </div>
  );
}
