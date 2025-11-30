import { useState, useEffect } from 'react';
import { Sale, CashRegisterSession } from '../types';

const SALES_STORAGE_KEY = 'pos_sales';
const SESSIONS_STORAGE_KEY = 'pos_sessions';

export function useSalesStorage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [sessions, setSessions] = useState<CashRegisterSession[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedSales = localStorage.getItem(SALES_STORAGE_KEY);
    const loadedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);

    if (loadedSales) {
      try {
        const parsed = JSON.parse(loadedSales);
        // Convert date strings back to Date objects
        const salesWithDates = parsed.map((sale: any) => ({
          ...sale,
          date: new Date(sale.date),
        }));
        setSales(salesWithDates);
      } catch (error) {
        console.error('Error loading sales:', error);
      }
    }

    if (loadedSessions) {
      try {
        const parsed = JSON.parse(loadedSessions);
        const sessionsWithDates = parsed.map((session: any) => ({
          ...session,
          openedAt: new Date(session.openedAt),
          closedAt: session.closedAt ? new Date(session.closedAt) : undefined,
          sales: session.sales.map((sale: any) => ({
            ...sale,
            date: new Date(sale.date),
          })),
        }));
        setSessions(sessionsWithDates);
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    }
  }, []);

  // Save sales to localStorage whenever they change
  useEffect(() => {
    if (sales.length > 0) {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    }
  }, [sales]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const addSale = (sale: Sale) => {
    setSales(prev => [...prev, sale]);
    
    // Update the current open session
    setSessions(prev => prev.map(session => {
      if (session.cashRegisterId === sale.cashRegisterId && session.status === 'open') {
        const updatedSales = [...session.sales, sale];
        const totalCash = updatedSales
          .filter(s => s.paymentMethod === 'cash')
          .reduce((sum, s) => sum + s.total, 0);
        const totalCard = updatedSales
          .filter(s => s.paymentMethod === 'card')
          .reduce((sum, s) => sum + s.total, 0);
        
        return {
          ...session,
          sales: updatedSales,
          totalSales: updatedSales.length,
          totalCash,
          totalCard,
          expectedBalance: session.openingBalance + totalCash,
        };
      }
      return session;
    }));
  };

  const startSession = (session: Omit<CashRegisterSession, 'id' | 'sales' | 'totalSales' | 'totalCash' | 'totalCard' | 'status'>) => {
    const newSession: CashRegisterSession = {
      ...session,
      id: `session_${Date.now()}`,
      sales: [],
      totalSales: 0,
      totalCash: 0,
      totalCard: 0,
      status: 'open',
      expectedBalance: session.openingBalance,
    };
    setSessions(prev => [...prev, newSession]);
    return newSession;
  };

  const closeSession = (cashRegisterId: string, closingBalance: number) => {
    setSessions(prev => prev.map(session => {
      if (session.cashRegisterId === cashRegisterId && session.status === 'open') {
        return {
          ...session,
          status: 'closed' as const,
          closedAt: new Date(),
          closingBalance,
        };
      }
      return session;
    }));
  };

  const getOpenSession = (cashRegisterId: string) => {
    return sessions.find(s => s.cashRegisterId === cashRegisterId && s.status === 'open');
  };

  const getSessionsByCashRegister = (cashRegisterId: string) => {
    return sessions.filter(s => s.cashRegisterId === cashRegisterId);
  };

  const getSalesByCashRegister = (cashRegisterId: string) => {
    return sales.filter(s => s.cashRegisterId === cashRegisterId);
  };

  const clearAllData = () => {
    setSales([]);
    setSessions([]);
    localStorage.removeItem(SALES_STORAGE_KEY);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
  };

  const clearSales = () => {
    setSales([]);
    localStorage.removeItem(SALES_STORAGE_KEY);
  };

  const clearSessions = () => {
    setSessions([]);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
  };

  return {
    sales,
    sessions,
    addSale,
    startSession,
    closeSession,
    getOpenSession,
    getSessionsByCashRegister,
    getSalesByCashRegister,
    clearAllData,
    clearSales,
    clearSessions,
  };
}
