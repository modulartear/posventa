import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthState, CompanySettings, Company } from '../types';

interface AuthContextType extends AuthState {
  login: (companyCode: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  companySettings: CompanySettings | null;
  company: Company | null;
  reloadCompanySettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    companyId: null,
    companyCode: null,
  });
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    console.log('🔍 AuthContext: Checking saved auth...');
    const savedAuth = localStorage.getItem('pos_auth');
    console.log('📦 Saved auth:', savedAuth ? 'Found' : 'Not found');
    
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth);
        console.log('✅ Restoring auth for user:', auth.username);
        setAuthState(auth);
        if (auth.companyId) {
          loadCompanyData(auth.companyId);
        }
      } catch (error) {
        console.error('❌ Error parsing saved auth:', error);
        localStorage.removeItem('pos_auth');
      }
    } else {
      console.log('ℹ️ No saved auth found - user needs to login');
    }
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    console.log('🔄 Auth state changed:', {
      isAuthenticated: authState.isAuthenticated,
      username: authState.username,
      companyId: authState.companyId
    });
  }, [authState]);

  // Periodic check to ensure session persistence
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(() => {
      const savedAuth = localStorage.getItem('pos_auth');
      if (!savedAuth && authState.isAuthenticated) {
        console.warn('⚠️ Session lost from localStorage, restoring...');
        localStorage.setItem('pos_auth', JSON.stringify(authState));
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [authState]);

  const loadCompanyData = async (companyId: string) => {
    try {
      // Load company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      if (companyData) {
        setCompany({
          id: companyData.id,
          name: companyData.name,
          subdomain: companyData.subdomain,
          code: companyData.code,
          plan: companyData.plan,
          isActive: companyData.is_active,
          maxCashRegisters: companyData.max_cash_registers,
          maxProducts: companyData.max_products,
          maxEmployees: companyData.max_employees,
          createdAt: companyData.created_at ? new Date(companyData.created_at) : undefined,
          updatedAt: companyData.updated_at ? new Date(companyData.updated_at) : undefined,
        });
      }

      // Load company settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      if (settingsData) {
        setCompanySettings({
          companyId: settingsData.company_id,
          companyName: settingsData.company_name,
          companyAddress: settingsData.company_address,
          companyPhone: settingsData.company_phone,
          companyEmail: settingsData.company_email,
          companyTaxId: settingsData.company_tax_id,
          companyLogo: settingsData.company_logo,
          adminUsername: settingsData.admin_username,
          adminPasswordHash: settingsData.admin_password_hash,
          createdAt: settingsData.created_at ? new Date(settingsData.created_at) : undefined,
          updatedAt: settingsData.updated_at ? new Date(settingsData.updated_at) : undefined,
        });
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const reloadCompanySettings = async () => {
    if (authState.companyId) {
      await loadCompanyData(authState.companyId);
    }
  };

  const login = async (companyCode: string, username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Find company by code
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('code', companyCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (companyError || !companyData) {
        return { success: false, error: 'Código de empresa no encontrado' };
      }

      // 2. Get company settings with credentials
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyData.id)
        .single();

      if (settingsError || !settingsData) {
        return { success: false, error: 'Configuración de empresa no encontrada' };
      }

      // 3. Validate credentials
      const isValid = settingsData.admin_username === username && settingsData.admin_password_hash === password;

      if (!isValid) {
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }

      // 4. Set auth state
      const newAuthState: AuthState = {
        isAuthenticated: true,
        username: username,
        companyId: companyData.id,
        companyCode: companyData.code,
      };

      console.log('✅ Login successful for:', username);
      setAuthState(newAuthState);
      localStorage.setItem('pos_auth', JSON.stringify(newAuthState));
      console.log('💾 Auth saved to localStorage');

      // 5. Load company data
      await loadCompanyData(companyData.id);

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    console.log('🚪 LOGOUT CALLED');
    console.trace('Logout stack trace');
    
    setAuthState({
      isAuthenticated: false,
      username: null,
      companyId: null,
      companyCode: null,
    });
    setCompanySettings(null);
    setCompany(null);
    localStorage.removeItem('pos_auth');
    console.log('🗑️ Auth removed from localStorage');
  };

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      companySettings, 
      company,
      reloadCompanySettings 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
