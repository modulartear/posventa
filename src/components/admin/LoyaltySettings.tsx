import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoyaltyCalculationType } from '../../types';
import { getLoyaltyProgram, saveLoyaltyProgram, LoyaltyProgramInput } from '../../services/loyalty';
import { QRCodeSVG } from 'qrcode.react';

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
  rewardThresholdPoints: 0,
  rewardLabel: '',
};

export default function LoyaltySettings() {
  const { companyId, company } = useAuth();
  const [form, setForm] = useState<LoyaltyProgramInput>(defaultProgram);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const registerUrl = company ? `${window.location.origin}/client/register?code=${company.code}` : '';

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
            rewardThresholdPoints: existing.rewardThresholdPoints,
            rewardLabel: existing.rewardLabel,
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

      {/* Resumen del programa en formato tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de programas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando programa de puntos...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Nombre</th>
                    <th className="text-left py-2 px-3">Método</th>
                    <th className="text-left py-2 px-3">Puntos / unidad</th>
                    <th className="text-left py-2 px-3">Unidad</th>
                    <th className="text-left py-2 px-3">Mín. compra</th>
                    <th className="text-left py-2 px-3">Mín. productos</th>
                    <th className="text-left py-2 px-3">Estado</th>
                    <th className="text-left py-2 px-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{form.name}</td>
                    <td className="py-2 px-3">
                      {form.calculationType === 'amount' ? 'Por monto' : 'Por cantidad'}
                    </td>
                    <td className="py-2 px-3">{form.pointsPerUnit}</td>
                    <td className="py-2 px-3">
                      {form.calculationType === 'amount'
                        ? `${form.unitValue} $`
                        : `${form.unitValue} productos`}
                    </td>
                    <td className="py-2 px-3">{form.minPurchase ?? 0}</td>
                    <td className="py-2 px-3">{form.minItems ?? 0}</td>
                    <td className="py-2 px-3">
                      <span
                        className={
                          form.isActive
                            ? 'inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                            : 'inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600'
                        }
                      >
                        {form.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        className="flex items-center gap-2"
                        onClick={() => handleChange('isActive', !form.isActive)}
                      >
                        {form.isActive ? (
                          <ToggleRight className="h-6 w-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                        <span className="text-xs">
                          {form.isActive ? 'Desactivar' : 'Activar'}
                        </span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {company && (
        <Card>
          <CardHeader>
            <CardTitle>QR para registro de clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneando este código, tus clientes acceden al formulario público de registro y se suman al programa
              de puntos de <span className="font-medium">{company.name}</span>.
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white rounded-lg border shadow-sm">
                <QRCodeSVG value={registerUrl} size={220} level="H" includeMargin />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Puedes imprimir este QR y pegarlo en la barra o mostrarlo en una tablet para que los clientes se
                registren con su DNI.
              </p>
              <div className="w-full">
                <label className="block text-xs font-medium mb-1">Enlace público de registro</label>
                <input
                  type="text"
                  readOnly
                  value={registerUrl}
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle>Objetivo de puntos y recompensa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Puntos necesarios para premio</label>
              <input
                type="number"
                min={0}
                value={form.rewardThresholdPoints ?? 0}
                onChange={(e) => handleChange('rewardThresholdPoints', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cantidad de puntos acumulados que se requieren para activar una recompensa.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción del premio</label>
              <input
                type="text"
                value={form.rewardLabel ?? ''}
                onChange={(e) => handleChange('rewardLabel', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ej: 1 trago gratis"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Texto que verá el cajero cuando el cliente cumpla el objetivo.
              </p>
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
