import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import { Building2, User, Lock, AlertCircle, CheckCircle, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RegisterCompanyPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    adminUsername: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const navigate = useNavigate();

  const generateCompanyCode = (companyName: string): string => {
    // Generar código basado en el nombre de la empresa
    const cleanName = companyName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Solo letras y números
      .substring(0, 6); // Máximo 6 caracteres

    // Agregar números aleatorios para unicidad
    const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    
    return `${cleanName}${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validaciones
      if (!formData.companyName || !formData.adminUsername || !formData.adminPassword) {
        setError('Nombre de empresa, usuario y contraseña son obligatorios');
        setLoading(false);
        return;
      }

      if (formData.adminPassword !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      if (formData.adminPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }

      // Generar código único
      let companyCode = generateCompanyCode(formData.companyName);
      let attempts = 0;
      let isUnique = false;

      // Verificar que el código sea único
      while (!isUnique && attempts < 10) {
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .eq('code', companyCode)
          .single();

        if (!existing) {
          isUnique = true;
        } else {
          // Generar nuevo código si ya existe
          companyCode = generateCompanyCode(formData.companyName);
          attempts++;
        }
      }

      if (!isUnique) {
        setError('No se pudo generar un código único. Intenta con otro nombre de empresa.');
        setLoading(false);
        return;
      }

      // Generar subdomain basado en el código
      const subdomain = companyCode.toLowerCase();

      // 1. Crear empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: formData.companyName,
          subdomain: subdomain,
          code: companyCode,
          plan: 'free',
          is_active: true,
          max_cash_registers: 1,
          max_products: 100,
          max_employees: 1,
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      if (!companyData) {
        throw new Error('No se pudo crear la empresa');
      }

      // 2. Crear configuración de empresa
      const { error: settingsError } = await supabase
        .from('company_settings')
        .insert([{
          company_id: companyData.id,
          company_name: formData.companyName,
          company_address: formData.companyAddress || null,
          company_phone: formData.companyPhone || null,
          company_email: formData.companyEmail || null,
          admin_username: formData.adminUsername,
          admin_password_hash: formData.adminPassword, // En producción: usar bcrypt
        }]);

      if (settingsError) throw settingsError;

      // 3. Crear configuración de APIs
      const { error: apiError } = await supabase
        .from('api_settings')
        .insert([{
          company_id: companyData.id,
          mercadopago_enabled: false,
        }]);

      if (apiError) throw apiError;

      // Éxito
      setGeneratedCode(companyCode);
      setSuccess(`¡Empresa creada exitosamente! Tu código es: ${companyCode}`);
      
      // Limpiar formulario
      setFormData({
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        adminUsername: '',
        adminPassword: '',
        confirmPassword: '',
      });

    } catch (error: any) {
      console.error('Error creating company:', error);
      setError(`Error al crear empresa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            Registrar Nueva Empresa
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Crea tu cuenta y comienza a usar el sistema POS
          </p>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  ¡Empresa Creada Exitosamente!
                </h3>
                <p className="text-green-800 mb-4">
                  {success}
                </p>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Tu código de empresa es:</p>
                  <p className="text-3xl font-bold text-primary font-mono">
                    {generatedCode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Guarda este código, lo necesitarás para iniciar sesión
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={handleGoToLogin} className="w-full">
                    Ir al Login
                  </Button>
                  <Button 
                    onClick={() => {
                      setSuccess('');
                      setGeneratedCode('');
                    }} 
                    variant="outline" 
                    className="w-full"
                  >
                    Registrar Otra Empresa
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Información de la Empresa */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información de la Empresa
                </h3>

                <div>
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
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se generará un código automático basado en este nombre
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
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

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
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
              </div>

              {/* Credenciales de Administrador */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Credenciales de Administrador
                </h3>

                <div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Lock className="h-4 w-4 inline mr-1" />
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Lock className="h-4 w-4 inline mr-1" />
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Plan Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📦 Plan Gratuito Incluye:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ 1 Caja Registradora</li>
                  <li>✅ Hasta 100 Productos</li>
                  <li>✅ 1 Empleado</li>
                  <li>✅ Reportes Básicos</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoToLogin}
                  className="flex-1"
                >
                  Volver al Login
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creando...' : 'Crear Empresa'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
