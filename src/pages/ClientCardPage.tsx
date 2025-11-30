import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { createCustomer, getCustomerByQr } from '@/services/customers';
import { SelectedCustomer } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';

interface CompanyInfo {
  id: string;
  name: string;
  code: string;
}

export default function ClientCardPage() {
  const [searchParams] = useSearchParams();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [customer, setCustomer] = useState<SelectedCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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

        // 1) Buscar empresa por código
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, code')
          .eq('code', companyCode.toUpperCase())
          .eq('is_active', true)
          .single();

        if (companyError || !companyData) {
          setError('No se encontró la empresa para este QR.');
          return;
        }

        const companyInfo: CompanyInfo = {
          id: companyData.id,
          name: companyData.name,
          code: companyData.code,
        };
        setCompany(companyInfo);

        const storageKey = `loyalty_customer_${companyInfo.id}`;
        const existingQr = localStorage.getItem(storageKey);

        // 2) Si ya existe un cliente para este dispositivo/empresa, recuperarlo
        if (existingQr) {
          const existing = await getCustomerByQr(companyInfo.id, existingQr);
          if (existing) {
            setCustomer(existing);
            return;
          }
        }

        // 3) Crear cliente anónimo
        const created = await createCustomer(companyInfo.id, {});
        localStorage.setItem(storageKey, created.customer.qrCode);
        setCustomer(created);
      } catch (e) {
        console.error('Error inicializando tarjeta de puntos:', e);
        setError('No se pudo cargar la tarjeta de puntos. Intenta nuevamente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [searchParams]);

  const handleRefresh = async () => {
    if (!company || !customer) return;
    setLoading(true);
    setError('');
    try {
      const updated = await getCustomerByQr(company.id, customer.customer.qrCode);
      if (updated) {
        setCustomer(updated);
      }
    } catch (e) {
      console.error('Error actualizando puntos del cliente:', e);
      setError('No se pudieron actualizar los puntos.');
    } finally {
      setLoading(false);
    }
  };

  const qrValue = customer?.customer.qrCode ?? '';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-xl font-bold">⭐ Tarjeta de Puntos ⭐</CardTitle>
          {company && (
            <p className="text-sm text-muted-foreground">
              {company.name} · Código: {company.code}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {loading && !customer && !error && (
            <p className="text-center text-sm text-muted-foreground">Generando tu tarjeta de puntos...</p>
          )}

          {customer && (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                  <QRCodeSVG value={qrValue} size={220} level="H" includeMargin />
                </div>
                <p className="mt-3 text-xs text-muted-foreground text-center px-4">
                  Mostrá este código en caja para acumular puntos en cada compra.
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">
                  Tus puntos: <span className="font-bold">{customer.points?.pointsBalance ?? 0}</span>
                </p>
                <p className="text-muted-foreground">
                  Puntos acumulados históricamente: {customer.points?.lifetimePoints ?? 0}
                </p>
              </div>

              <Button onClick={handleRefresh} disabled={loading} className="w-full">
                {loading ? 'Actualizando...' : 'Actualizar puntos'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
