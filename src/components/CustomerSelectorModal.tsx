import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { X, QrCode, UserPlus, Users, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SelectedCustomer } from '../types';
import { getCustomerByQr, createCustomer, CustomerInput } from '../services/customers';

type Step = 'options' | 'search' | 'manual' | 'result';

interface CustomerSelectorModalProps {
  onClose: () => void;
  onSelect: (customer: SelectedCustomer) => void;
}

export default function CustomerSelectorModal({ onClose, onSelect }: CustomerSelectorModalProps) {
  const { companyId } = useAuth();
  const [step, setStep] = useState<Step>('options');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<SelectedCustomer | null>(null);
  const [manualInput, setManualInput] = useState<CustomerInput>({ name: '', email: '', phone: '' });
  const [searchCode, setSearchCode] = useState<string>('');

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim() || !companyId || loading) return;
    setLoading(true);
    setError('');
    try {
      const customer = await getCustomerByQr(companyId, searchCode.trim());
      if (!customer) {
        setError('No encontramos un cliente con ese código.');
        return;
      }
      setResult(customer);
      setStep('result');
    } catch (e) {
      console.error(e);
      setError('No se pudo buscar el cliente. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      setError('No se pudo identificar la empresa.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await createCustomer(companyId, manualInput);
      setResult(created);
      setStep('result');
    } catch (e) {
      console.error(e);
      setError('No se pudo crear el cliente. Revisa los datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setError('');
    setLoading(false);
    setResult(null);
    setManualInput({ name: '', email: '', phone: '' });
    setSearchCode('');
    setStep('options');
  };

  const renderContent = () => {
    switch (step) {
      case 'options':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Identifica al cliente para acumular o consultar sus puntos.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="border-2 rounded-lg p-4 text-left hover:border-primary/60"
                onClick={() => {
                  setStep('search');
                  setError('');
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Buscar por código</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ingresa el código QR del cliente manualmente.
                </p>
              </button>
              <button
                type="button"
                className="border-2 rounded-lg p-4 text-left hover:border-primary/60"
                onClick={() => {
                  setStep('manual');
                  setError('');
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Registrar nuevo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Crea un cliente y genera un QR único para futuras compras.
                </p>
              </button>
            </div>
          </div>
        );

      case 'search':
        return (
          <form className="space-y-4" onSubmit={handleSearchSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">Código del cliente</label>
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ej: CUS-1234567890-ABC123"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ingresa el código QR que aparece en la tarjeta del cliente.
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={resetFlow}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading || !searchCode.trim()}>
                {loading ? 'Buscando...' : 'Buscar cliente'}
              </Button>
            </div>
          </form>
        );

      case 'manual':
        return (
          <form className="space-y-4" onSubmit={handleManualSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del cliente</label>
              <input
                type="text"
                value={manualInput.name || ''}
                onChange={(e) => setManualInput(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ej: María Pérez"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={manualInput.email || ''}
                  onChange={(e) => setManualInput(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={manualInput.phone || ''}
                  onChange={(e) => setManualInput(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="11 2345-6789"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={resetFlow}>
                Volver
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear cliente'}
              </Button>
            </div>
          </form>
        );

      case 'result':
        if (!result) return null;
        return (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{result.customer.name || 'Cliente sin nombre'}</p>
                  <p className="text-sm text-muted-foreground">ID: {result.customer.qrCode}</p>
                </div>
              </div>
              <p className="text-sm">
                Puntos actuales: <strong>{result.points?.pointsBalance ?? 0}</strong>
              </p>
              <p className="text-sm">
                Puntos acumulados: <strong>{result.points?.lifetimePoints ?? 0}</strong>
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={resetFlow}>
                Cambiar cliente
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  onSelect(result);
                  onClose();
                }}
              >
                Usar este cliente
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70]">
      <Card className="w-full max-w-xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Identificar Cliente
          </CardTitle>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
