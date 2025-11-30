import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Product, Employee, CashRegister, Sale, CashRegisterSession } from '../types';

export function useDatabase() {
  // Live queries - se actualizan automáticamente cuando cambia la DB
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const employees = useLiveQuery(() => db.employees.toArray(), []) || [];
  const cashRegisters = useLiveQuery(() => db.cashRegisters.toArray(), []) || [];
  const sales = useLiveQuery(() => db.sales.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) || [];

  // Products
  const addProduct = async (product: Omit<Product, 'id'>) => {
    const id = Date.now().toString();
    await db.products.add({ ...product, id });
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    await db.products.update(id, updates);
  };

  const deleteProduct = async (id: string) => {
    await db.products.delete(id);
  };

  const clearProducts = async () => {
    await db.products.clear();
  };

  // Employees
  const addEmployee = async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    await db.employees.add({ 
      ...employee, 
      id, 
      createdAt: new Date() 
    });
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    await db.employees.update(id, updates);
  };

  const deleteEmployee = async (id: string) => {
    await db.employees.delete(id);
  };

  const clearEmployees = async () => {
    await db.employees.clear();
  };

  // Cash Registers
  const addCashRegister = async (register: Omit<CashRegister, 'id' | 'accessToken'>) => {
    const id = Date.now().toString();
    const accessToken = generateToken();
    await db.cashRegisters.add({ 
      ...register, 
      id, 
      accessToken 
    });
  };

  const updateCashRegister = async (id: string, updates: Partial<CashRegister>) => {
    await db.cashRegisters.update(id, updates);
  };

  const deleteCashRegister = async (id: string) => {
    await db.cashRegisters.delete(id);
  };

  const getCashRegisterByToken = async (token: string) => {
    return await db.cashRegisters.where('accessToken').equals(token).first();
  };

  const clearCashRegisters = async () => {
    await db.cashRegisters.clear();
  };

  // Sales
  const addSale = async (sale: Sale) => {
    await db.sales.add(sale);
    
    // Update session
    const session = await db.sessions
      .where('cashRegisterId').equals(sale.cashRegisterId)
      .and(s => s.status === 'open')
      .first();
    
    if (session) {
      const sessionSales = await db.sales
        .where('cashRegisterId').equals(sale.cashRegisterId)
        .toArray();
      
      const totalCash = sessionSales
        .filter(s => s.paymentMethod === 'cash')
        .reduce((sum, s) => sum + s.total, 0);
      
      const totalCard = sessionSales
        .filter(s => s.paymentMethod === 'card')
        .reduce((sum, s) => sum + s.total, 0);
      
      await db.sessions.update(session.id, {
        totalSales: sessionSales.length,
        totalCash,
        totalCard,
        expectedBalance: session.openingBalance + totalCash,
      });
    }
  };

  const clearSales = async () => {
    await db.sales.clear();
  };

  // Sessions
  const startSession = async (
    session: Omit<CashRegisterSession, 'id' | 'sales' | 'totalSales' | 'totalCash' | 'totalCard' | 'status'>
  ) => {
    const id = `session_${Date.now()}`;
    const newSession: CashRegisterSession = {
      ...session,
      id,
      sales: [],
      totalSales: 0,
      totalCash: 0,
      totalCard: 0,
      status: 'open',
      expectedBalance: session.openingBalance,
    };
    await db.sessions.add(newSession);
    return newSession;
  };

  const closeSession = async (cashRegisterId: string, closingBalance: number) => {
    const session = await db.sessions
      .where('cashRegisterId').equals(cashRegisterId)
      .and(s => s.status === 'open')
      .first();
    
    if (session) {
      await db.sessions.update(session.id, {
        status: 'closed',
        closedAt: new Date(),
        closingBalance,
      });
    }
  };

  const getOpenSession = async (cashRegisterId: string) => {
    return await db.sessions
      .where('cashRegisterId').equals(cashRegisterId)
      .and(s => s.status === 'open')
      .first();
  };

  const getSessionsByCashRegister = async (cashRegisterId: string) => {
    return await db.sessions
      .where('cashRegisterId').equals(cashRegisterId)
      .toArray();
  };

  const clearSessions = async () => {
    await db.sessions.clear();
  };

  return {
    // Data
    products,
    employees,
    cashRegisters,
    sales,
    sessions,
    // Products
    addProduct,
    updateProduct,
    deleteProduct,
    clearProducts,
    // Employees
    addEmployee,
    updateEmployee,
    deleteEmployee,
    clearEmployees,
    // Cash Registers
    addCashRegister,
    updateCashRegister,
    deleteCashRegister,
    getCashRegisterByToken,
    clearCashRegisters,
    // Sales
    addSale,
    clearSales,
    // Sessions
    startSession,
    closeSession,
    getOpenSession,
    getSessionsByCashRegister,
    clearSessions,
  };
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
