import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterCompanyPage from './pages/RegisterCompanyPage';
import POSTerminal from './pages/POSTerminal';
import ProtectedRoute from './components/ProtectedRoute';
import './db/resetDatabase'; // Import to expose global functions
import './utils/fixTokens'; // Import to expose fixTokens function

function RouteDebug() {
  const location = useLocation();
  console.log('Current route:', location.pathname);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <RouteDebug />
      <AuthProvider>
        <AdminProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterCompanyPage />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/pos/:token" element={<POSTerminal />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
