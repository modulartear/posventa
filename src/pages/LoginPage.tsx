import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import { Lock, User, AlertCircle, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [companyCode, setCompanyCode] = useState('DEFAULT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, company } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(companyCode, username, password);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <Lock className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {company?.name || 'Sistema POS'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Panel de Administración
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Código de Empresa
              </label>
              <input
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="DEFAULT"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Código único de tu empresa
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Lock className="h-4 w-4 inline mr-1" />
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-3">
              ¿No tienes una empresa registrada?
            </p>
            <Link to="/register">
              <Button variant="outline" className="w-full">
                Registrar Nueva Empresa
              </Button>
            </Link>
          </div>

          {company && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Código: {company.code}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
