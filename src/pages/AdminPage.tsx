import { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import ProductManagement from '../components/admin/ProductManagement';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import CashRegisterManagement from '../components/admin/CashRegisterManagement';
import SalesHistory from '../components/admin/SalesHistory';
import Settings from '../components/admin/Settings';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'employees' | 'registers' | 'sales' | 'settings'>('dashboard');

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'products' && <ProductManagement />}
      {activeTab === 'employees' && <EmployeeManagement />}
      {activeTab === 'registers' && <CashRegisterManagement />}
      {activeTab === 'sales' && <SalesHistory />}
      {activeTab === 'settings' && <Settings />}
    </AdminLayout>
  );
}
