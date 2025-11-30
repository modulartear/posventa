import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { Key, Save, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function APISettings() {
  const { companyId } = useAuth();
  const [formData, setFormData] = useState({
    mercadopagoAccessToken: '',
    mercadopagoPublicKey: '',
    mercadopagoEnabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('api_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setHasExistingConfig(true);
        setFormData({
          mercadopagoAccessToken: data.mercadopago_access_token || '',
          mercadopagoPublicKey: data.mercadopago_public_key || '',
          mercadopagoEnabled: data.mercadopago_enabled || false,
        });
      }
    } catch (error) {
      console.error('Error loading API settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    if (!companyId) {
      setMessage({ type: 'error', text: 'No se pudo identificar la empresa' });
      setLoading(false);
      return;
    }
    
    try {
      const settingsData = {
        company_id: companyId,
        mercadopago_access_token: formData.mercadopagoAccessToken,
        mercadopago_public_key: formData.mercadopagoPublicKey,
        mercadopago_enabled: formData.mercadopagoEnabled,
      };

      if (hasExistingConfig) {
        // Update existing
        const { error } = await supabase
          .from('api_settings')
          .update(settingsData)
          .eq('company_id', companyId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('api_settings')
          .insert([settingsData]);

        if (error) throw error;
        setHasExistingConfig(true);
      }

      setMessage({ type: 'success', text: '✅ Configuración de APIs guardada exitosamente' });
      
      // Reload settings to confirm
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving API settings:', error);
      setMessage({ type: 'error', text: `Error al guardar: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Test connection removed due to CORS restrictions
  // The token will be validated when processing actual payments

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Configuración de APIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-lg flex items-start gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Mercado Pago Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Mercado Pago</h3>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>📖 Cómo obtener tus credenciales:</strong>
              </p>
              <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Ingresa a <a href="https://www.mercadopago.com.ar/developers" target="_blank" rel="noopener noreferrer" className="underline font-medium">Mercado Pago Developers</a></li>
                <li>Ve a "Tus integraciones" → "Credenciales"</li>
                <li>Copia el "Access Token" y "Public Key"</li>
                <li>Pégalos en los campos de abajo</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Access Token (Producción)
              </label>
              <input
                type="password"
                value={formData.mercadopagoAccessToken}
                onChange={(e) => setFormData({ ...formData, mercadopagoAccessToken: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="APP_USR-..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Token privado para procesar pagos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Public Key
              </label>
              <input
                type="text"
                value={formData.mercadopagoPublicKey}
                onChange={(e) => setFormData({ ...formData, mercadopagoPublicKey: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="APP_USR-..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Clave pública para el frontend
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="mp-enabled"
                checked={formData.mercadopagoEnabled}
                onChange={(e) => setFormData({ ...formData, mercadopagoEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="mp-enabled" className="text-sm font-medium cursor-pointer">
                Habilitar pagos con Mercado Pago
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>💡 Nota:</strong> Las credenciales se validarán automáticamente al procesar el primer pago.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
