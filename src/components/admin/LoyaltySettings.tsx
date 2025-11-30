import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoyaltyCalculationType } from '../../types';
import { getLoyaltyProgram, saveLoyaltyProgram, LoyaltyProgramInput } from '../../services/loyalty';

const calculationOptions: { value: LoyaltyCalculationType; label: string; description: string }[] = [
  {
    value: 'amount',
    label: 'Por monto de compra',
    description: 'Define cuántos puntos se otorgan por cada monto gastado (ej: 10 pts cada $1.000).',
  },
  {
    value: 'quantity',
    label: 'Por cantidad de productos',
    description: 'Define cuántos puntos se otorgan por cada producto comprado.',
  },
];

const defaultProgram: LoyaltyProgramInput = {
  name: 'Programa de puntos',
  calculationType: 'amount',
  pointsPerUnit: 1,
  unitValue: 1000,
  minPurchase: 0,
  minItems: 0,
  isActive: false,
};

export default function LoyaltySettings() {
  const { companyId } = useAuth();
  const [form, setForm] = useState<LoyaltyProgramInput>(defaultProgram);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadProgram = async () => {
      if (!companyId) return;
      setLoading(true);
      setError('');
      try {
        const existing = await getLoyaltyProgram(companyId);
        if (existing) {
          setForm({
            name: existing.name,
            calculationType: existing.calculationType,
            pointsPerUnit: existing.pointsPerUnit,
            unitValue: existing.unitValue,
            minPurchase: existing.minPurchase,
            minItems: existing.minItems,
            isActive: existing.isActive,
          });
        } else {
          setForm(defaultProgram);
        }
      } catch (err) {
        console.error('Error loading loyalty program', err);
        setError('No se pudo cargar el programa de puntos.');
      } finally {
        setLoading(false);
      }
    };

    loadProgram();
  }, [companyId]);

  const handleChange = (field: keyof LoyaltyProgramInput, value: string | number | boolean | undefined) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      setError('No se pudo identificar la empresa.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await saveLoyaltyProgram(companyId, form);
      setMessage('Programa guardado correctamente.');
    } catch (err) {
      console.error('Error saving loyalty program', err);
      setError('No se pudo guardar el programa. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Programa de Puntos</h2>
        <p className="text-muted-foreground">Define cómo se acumulan los puntos por compra.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado del programa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Programa {form.isActive ? 'activado' : 'desactivado'}</p>
              <p className="text-sm text-muted-foreground">
                {form.isActive
                  ? 'Los clientes acumularán puntos automáticamente en cada compra.'
                  : 'Activa el programa para comenzar a otorgar puntos.'}
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => handleChange('isActive', !form.isActive)}
            >
              {form.isActive ? (
                <ToggleRight className="h-10 w-10 text-green-500" />
              ) : (
                <ToggleLeft className="h-10 w-10 text-gray-400" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del programa</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ej: Clientes VIP"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Método de cálculo</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {calculationOptions.map(option => (
                  <label
                    key={option.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      form.calculationType === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="calculationType"
                      value={option.value}
                      checked={form.calculationType === option.value}
                      onChange={() => handleChange('calculationType', option.value)}
                      className="sr-only"
                    />
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Puntos por unidad</label>
                <input
                  type="number"
                  min={1}
                  value={form.pointsPerUnit}
                  onChange={(e) => handleChange('pointsPerUnit', Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cantidad de puntos otorgados por cada unidad definida abajo.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {form.calculationType === 'amount' ? 'Monto por unidad ($)' : 'Productos por unidad'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.unitValue}
                  onChange={(e) => handleChange('unitValue', Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.calculationType === 'amount'
                    ? 'Ej: 1 punto cada $1000.'
                    : 'Ej: 2 puntos por cada producto comprado.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condiciones opcionales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Monto mínimo de compra ($)</label>
              <input
                type="number"
                min={0}
                value={form.minPurchase ?? 0}
                onChange={(e) => handleChange('minPurchase', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Solo otorgará puntos si la compra supera este monto.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad mínima de productos</label>
              <input
                type="number"
                min={0}
                value={form.minItems ?? 0}
                onChange={(e) => handleChange('minItems', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ideal para campañas por volumen de compra.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || loading} className="gap-2">
            {saving ? 'Guardando...' : 'Guardar programa'}
          </Button>
          {message && <span className="text-sm text-green-600">{message}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </div>
  );
}
