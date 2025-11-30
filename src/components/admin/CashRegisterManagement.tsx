import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { Plus, Edit2, Trash2, Power, PowerOff, Copy, Link as LinkIcon, Check, ExternalLink } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { CashRegister } from '../../types';
import { formatCurrency } from '../../lib/utils';
import CashRegisterOpeningModal from './CashRegisterOpeningModal';
import CashRegisterClosing from './CashRegisterClosing';

export default function CashRegisterManagement() {
  const { cashRegisters, employees, addCashRegister, updateCashRegister, deleteCashRegister, startSession, getOpenSession, closeSession } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [openingRegister, setOpeningRegister] = useState<CashRegister | null>(null);
  const [closingRegister, setClosingRegister] = useState<CashRegister | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    openingBalance: '',
  });

  const activeEmployees = employees.filter(e => e.isActive && e.role === 'cashier');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
    
    const registerData = {
      name: formData.name,
      employeeId: formData.employeeId,
      employeeName: selectedEmployee?.name || '',
      openingBalance: parseFloat(formData.openingBalance),
      currentBalance: parseFloat(formData.openingBalance),
      isActive: false,
    };

    if (editingRegister) {
      updateCashRegister(editingRegister.id, {
        name: formData.name,
        employeeId: formData.employeeId,
        employeeName: selectedEmployee?.name || '',
      });
    } else {
      addCashRegister(registerData);
    }

    resetForm();
  };

  const handleEdit = (register: CashRegister) => {
    setEditingRegister(register);
    setFormData({
      name: register.name,
      employeeId: register.employeeId || '',
      openingBalance: register.openingBalance.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const register = cashRegisters.find((r) => r.id === id);
    if (register?.isActive) {
      alert('No puedes eliminar una caja activa. Primero ciérrala.');
      return;
    }
    if (confirm('¿Estás seguro de eliminar esta caja?')) {
      deleteCashRegister(id);
    }
  };

  const handleOpenCashRegister = async (register: CashRegister) => {
    // Check if there's already an open session
    const existingSession = getOpenSession(register.id);
    if (existingSession) {
      const shouldClose = confirm(
        'Esta caja ya tiene una sesión activa.\n\n' +
        'Esto puede ocurrir si la sesión no se cerró correctamente.\n\n' +
        '¿Deseas cerrar la sesión actual y abrir una nueva?'
      );
      
      if (shouldClose) {
        try {
          // Close the existing session with current balance
          await closeSession(register.id, register.currentBalance);
          // After closing, open the modal to create a new session
          setOpeningRegister(register);
          return;
        } catch (error) {
          alert('❌ Error al cerrar la sesión anterior');
          return;
        }
      }
      return;
    }
    setOpeningRegister(register);
  };

  const handleConfirmOpening = async (openingBalance: number) => {
    if (!openingRegister) return;

    // Update cash register
    await updateCashRegister(openingRegister.id, {
      isActive: true,
      openedAt: new Date(),
      openingBalance: openingBalance,
      currentBalance: openingBalance,
    });

    // Create session
    await startSession({
      cashRegisterId: openingRegister.id,
      cashRegisterName: openingRegister.name,
      employeeId: openingRegister.employeeId || '',
      employeeName: openingRegister.employeeName,
      openedAt: new Date(),
      openingBalance: openingBalance,
    });

    setOpeningRegister(null);
    alert('✅ Caja abierta exitosamente');
  };

  const handleCloseCashRegister = async (register: CashRegister) => {
    const session = getOpenSession(register.id);
    if (!session) {
      // Estado inconsistente: caja activa sin sesión
      const shouldReset = confirm(
        'Esta caja está marcada como activa pero no tiene una sesión activa.\n\n' +
        'Esto puede ocurrir si se limpiaron las sesiones mientras la caja estaba abierta.\n\n' +
        '¿Deseas resetear el estado de la caja para poder abrirla nuevamente?'
      );
      
      if (shouldReset) {
        await updateCashRegister(register.id, {
          isActive: false,
          currentBalance: 0,
          openingBalance: 0,
        });
        alert('✅ Estado de la caja reseteado. Ahora puedes abrirla nuevamente.');
      }
      return;
    }
    setClosingRegister(register);
  };

  const copyPOSLink = (register: CashRegister) => {
    const baseUrl = window.location.origin;
    const posUrl = `${baseUrl}/pos/${register.accessToken}`;
    navigator.clipboard.writeText(posUrl);
    setCopiedToken(register.id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const openPOSLink = (register: CashRegister) => {
    const baseUrl = window.location.origin;
    const posUrl = `${baseUrl}/pos/${register.accessToken}`;
    window.open(posUrl, '_blank');
  };

  const getPOSUrl = (register: CashRegister) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/pos/${register.accessToken}`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      employeeId: '',
      openingBalance: '',
    });
    setEditingRegister(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Gestión de Cajas</h2>
          <p className="text-muted-foreground">Administra las cajas y asigna empleados</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Caja
        </Button>
      </div>

      {/* Cash Registers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cashRegisters.map((register) => (
          <Card key={register.id} className={register.isActive ? 'border-green-500 border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{register.name}</CardTitle>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  register.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {register.isActive ? 'Activa' : 'Cerrada'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Responsable</p>
                <p className="font-semibold text-lg">{register.employeeName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo Inicial</p>
                  <p className="font-semibold">{formatCurrency(register.openingBalance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo Actual</p>
                  <p className="font-semibold">{formatCurrency(register.currentBalance)}</p>
                </div>
              </div>

              {register.isActive && register.openedAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Abierta desde</p>
                  <p className="text-sm">
                    {new Date(register.openedAt).toLocaleString('es-AR')}
                  </p>
                </div>
              )}

              {/* POS Link */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-900 flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    Link POS
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openPOSLink(register)}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Abrir POS en nueva pestaña"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => copyPOSLink(register)}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Copiar link"
                    >
                      {copiedToken === register.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blue-700 break-all font-mono leading-relaxed">
                  {getPOSUrl(register)}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                {register.isActive ? (
                  <Button
                    onClick={() => handleCloseCashRegister(register)}
                    variant="outline"
                    className="flex-1 gap-2"
                    size="sm"
                  >
                    <PowerOff className="h-4 w-4" />
                    Cerrar Caja
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleOpenCashRegister(register)}
                    variant="default"
                    className="flex-1 gap-2"
                    size="sm"
                  >
                    <Power className="h-4 w-4" />
                    Abrir Caja
                  </Button>
                )}
                <button
                  onClick={() => handleEdit(register)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  disabled={register.isActive}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(register.id)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  disabled={register.isActive}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cashRegisters.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay cajas registradas. Crea una nueva para comenzar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingRegister ? 'Editar Caja' : 'Nueva Caja'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de la Caja</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Caja 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Empleado Responsable</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  {activeEmployees.length === 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      No hay empleados activos. Crea uno primero en la sección de Empleados.
                    </p>
                  )}
                </div>

                {!editingRegister && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Saldo Inicial</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={activeEmployees.length === 0 && !editingRegister}>
                    {editingRegister ? 'Actualizar' : 'Crear'} Caja
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opening Modal */}
      {openingRegister && (
        <CashRegisterOpeningModal
          cashRegister={openingRegister}
          onClose={() => setOpeningRegister(null)}
          onConfirm={handleConfirmOpening}
        />
      )}

      {/* Closing Modal */}
      {closingRegister && (
        <CashRegisterClosing
          cashRegister={closingRegister}
          onClose={() => setClosingRegister(null)}
          onConfirm={() => {
            setClosingRegister(null);
            alert('✅ Caja cerrada exitosamente. El próximo período comenzará en $0');
          }}
        />
      )}
    </div>
  );
}
