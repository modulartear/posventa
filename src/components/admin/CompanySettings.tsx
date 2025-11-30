import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import Button from '../Button';
import { Building2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function CompanySettings() {
  const { reloadCompanySettings } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyTaxId: '',
    adminUsername: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', 'company_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setHasExistingConfig(true);
        setFormData({
          companyName: data.company_name || '',
          companyAddress: data.company_address || '',
          companyPhone: data.company_phone || '',
          companyEmail: data.company_email || '',
          companyTaxId: data.company_tax_id || '',
          adminUsername: data.admin_username || '',
          adminPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate passwords if changing
    if (formData.adminPassword && formData.adminPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (!formData.companyName || !formData.adminUsername) {
      setMessage({ type: 'error', text: 'Nombre de empresa y usuario son obligatorios' });
      return;
    }

    setLoading(true);

    try {
      const settingsData: any = {
        id: 'company_config',
        company_name: formData.companyName,
        company_address: formData.companyAddress,
        company_phone: formData.companyPhone,
        company_email: formData.companyEmail,
        company_tax_id: formData.companyTaxId,
        admin_username: formData.adminUsername,
      };

      // Only update password if provided
      if (formData.adminPassword) {
        // In production, hash the password with bcrypt
        // For now, we'll store it directly (NOT SECURE - just for demo)
        settingsData.admin_password_hash = formData.adminPassword;
      }

      if (hasExistingConfig) {
        // Update existing
        const { error } = await supabase
          .from('company_settings')
          .update(settingsData)
          .eq('id', 'company_config');

        if (error) throw error;
      } else {
        // Insert new
        if (!formData.adminPassword) {
          setMessage({ type: 'error', text: 'La contraseña es obligatoria para la configuración inicial' });
          setLoading(false);
          return;
        }

        settingsData.admin_password_hash = formData.adminPassword;

        const { error } = await supabase
          .from('company_settings')
          .insert([settingsData]);

        if (error) throw error;
        setHasExistingConfig(true);
      }

      setMessage({ type: 'success', text: '✅ Configuración guardada exitosamente' });
      setFormData({ ...formData, adminPassword: '', confirmPassword: '' });
      
      // Reload company settings in AuthContext to update header and login page
      await reloadCompanySettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: `Error al guardar: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Configuración de Empresa
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: Mi Negocio S.A."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Calle 123, Ciudad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.companyPhone}
                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                CUIT / RUT / Tax ID
              </label>
              <input
                type="text"
                value={formData.companyTaxId}
                onChange={(e) => setFormData({ ...formData, companyTaxId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="20-12345678-9"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Credenciales de Administrador</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Usuario *
                </label>
                <input
                  type="text"
                  value={formData.adminUsername}
                  onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="admin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {hasExistingConfig ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required={!hasExistingConfig}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required={!!formData.adminPassword}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
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
