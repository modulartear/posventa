import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { registerCustomerByDni } from '@/services/customers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';

interface CompanyInfo {
  id: string;
  name: string;
  code: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
}

const initialForm: FormState = {
  firstName: '',
  lastName: '',
  dni: '',
  email: '',
  phone: '',
};

export default function ClientRegisterPage() {
  const [searchParams] = useSearchParams();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');

      try {
        const companyCode = searchParams.get('code');
        if (!companyCode) {
          setError('Falta el código de empresa en el enlace.');
          return;
        }

        const { data, error: companyError } = await supabase
          .from('companies')
          .select('id, name, code')
          .eq('code', companyCode.toUpperCase())
          .eq('is_active', true)
          .single();

        if (companyError || !data) {
          setError('No se encontró la empresa para este QR.');
          return;
        }

        setCompany({
          id: data.id,
          name: data.name,
          code: data.code,
        });
      } catch (e) {
        console.error('Error cargando empresa para registro de cliente:', e);
        setError('No se pudo cargar la empresa. Intenta nuevamente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [searchParams]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!form.dni.trim()) {
        setError('El DNI es obligatorio.');
        return;
      }

      const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' ');

      await registerCustomerByDni(company.id, {
        dni: form.dni.trim(),
        name: fullName || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });

      setSuccessMessage('¡Listo! Ya estás registrado en el programa de puntos.');
    } catch (e) {
      console.error('Error registrando cliente por DNI:', e);
      setError('No se pudo registrar el cliente. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-bold">Registro al Programa de Puntos</CardTitle>
          {company && (
            <p className="text-sm text-muted-foreground">
              {company.name} · Código: {company.code}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground text-center">Cargando...</p>}

          {error && !loading && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ej: Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Apellido</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => handleChange('lastName', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">DNI *</label>
                <input
                  type="text"
                  value={form.dni}
                  onChange={e => handleChange('dni', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: 12345678"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usaremos tu DNI para identificarte en caja y sumar tus puntos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Celular</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="11 2345-6789"
                />
              </div>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">
                  {successMessage}
                </div>
              )}

              <Button type="submit" disabled={submitting || loading || !company} className="w-full">
                {submitting ? 'Guardando...' : 'Registrarme'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
