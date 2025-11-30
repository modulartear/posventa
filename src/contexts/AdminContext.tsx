// ARCHIVO: src/contexts/AdminContext.tsx
// Copia todo este contenido y reemplaza el archivo AdminContext.tsx existente

import { createContext, useContext, ReactNode } from 'react';
import { Product, Employee, CashRegister, Sale, CashRegisterSession } from '../types';
import { useSupabaseDatabase } from '../hooks/useSupabaseDatabase';
import { useAuth } from './AuthContext';

interface AdminContextType {
  products: Product[];
  employees: Employee[];
  cashRegisters: CashRegister[];
  sales: Sale[];
  sessions: CashRegisterSession[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addCashRegister: (register: Omit<CashRegister, 'id' | 'accessToken'>) => Promise<void>;
  updateCashRegister: (id: string, register: Partial<CashRegister>) => Promise<void>;
  deleteCashRegister: (id: string) => Promise<void>;
  getCashRegisterByToken: (token: string) => CashRegister | undefined;
  addSale: (sale: Sale) => Promise<void>;
  startSession: (session: Omit<CashRegisterSession, 'id' | 'sales' | 'totalSales' | 'totalCash' | 'totalCard' | 'status'>) => Promise<CashRegisterSession>;
  closeSession: (cashRegisterId: string, closingBalance: number) => Promise<void>;
  getOpenSession: (cashRegisterId: string) => CashRegisterSession | undefined;
  getSessionsByCashRegister: (cashRegisterId: string) => CashRegisterSession[];
  clearProducts: () => Promise<void>;
  clearEmployees: () => Promise<void>;
  clearCashRegisters: () => Promise<void>;
  clearSales: () => Promise<void>;
  clearSessions: () => Promise<void>;
  loadArchivedData: (startDate?: Date, endDate?: Date) => Promise<{ sales: Sale[]; sessions: CashRegisterSession[] }>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { companyId } = useAuth();
  const db = useSupabaseDatabase(companyId);
  
  const loadArchivedData = async (startDate?: Date, endDate?: Date) => {
    return await db.loadArchivedData(startDate, endDate);
  };

  // Sync functions for compatibility
  const getCashRegisterByToken = (token: string) => {
    console.log('Buscando token:', token);
    console.log('Cajas en memoria:', db.cashRegisters);
    console.log('Comparando tokens:');
    db.cashRegisters.forEach(r => {
      console.log(`  - ${r.name}: "${r.accessToken}" === "${token}" ?`, r.accessToken === token);
    });
    const found = db.cashRegisters.find(r => r.accessToken === token);
    console.log('Caja encontrada:', found);
    return found;
  };

  const getOpenSession = (cashRegisterId: string) => {
    return db.sessions.find(s => s.cashRegisterId === cashRegisterId && s.status === 'open');
  };

  const getSessionsByCashRegister = (cashRegisterId: string) => {
    return db.sessions.filter(s => s.cashRegisterId === cashRegisterId);
  };

  return (
    <AdminContext.Provider
      value={{
        // Data from database (live queries)
        products: db.products,
        employees: db.employees,
        cashRegisters: db.cashRegisters,
        sales: db.sales,
        sessions: db.sessions,
        // Products
        addProduct: db.addProduct,
        updateProduct: db.updateProduct,
        deleteProduct: db.deleteProduct,
        clearProducts: db.clearProducts,
        // Employees
        addEmployee: db.addEmployee,
        updateEmployee: db.updateEmployee,
        deleteEmployee: db.deleteEmployee,
        clearEmployees: db.clearEmployees,
        // Cash Registers
        addCashRegister: async (register: Omit<CashRegister, 'id' | 'accessToken'>) => {
          // Generate a safe token without special characters
          const safeName = register.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric with dash
            .replace(/^-+|-+$/g, '');      // Remove leading/trailing dashes
          const randomPart = Math.random().toString(36).substring(2, 15);
          const token = `${safeName}-${randomPart}`;
          await db.addCashRegister({ ...register, accessToken: token });
        },
        updateCashRegister: db.updateCashRegister,
        deleteCashRegister: db.deleteCashRegister,
        getCashRegisterByToken,
        clearCashRegisters: db.clearCashRegisters,
        // Sales
        addSale: db.addSale,
        clearSales: db.clearSales,
        // Sessions
        startSession: db.startSession,
        closeSession: db.closeSession,
        getOpenSession,
        getSessionsByCashRegister,
        clearSessions: db.clearSessions,
        // Archived data
        loadArchivedData,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
