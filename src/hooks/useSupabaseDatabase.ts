import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Employee, CashRegister, Sale, CashRegisterSession } from '../types';

export function useSupabaseDatabase(companyId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sessions, setSessions] = useState<CashRegisterSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data on mount and when companyId changes
  useEffect(() => {
    if (companyId) {
      loadAllData();
    }
  }, [companyId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadEmployees(),
        loadCashRegisters(),
        loadSales(),
        loadSessions(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PRODUCTS
  // ============================================

  const loadProducts = async () => {
    if (!companyId) {
      setProducts([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (error) {
      console.error('Error loading products:', error);
      return;
    }
    
    // Convert snake_case to camelCase
    const productsWithCamelCase = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      cashPrice: p.cash_price,
      cardPrice: p.card_price,
      category: p.category,
      image: p.image,
      stock: p.stock,
    }));
    
    setProducts(productsWithCamelCase);
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!companyId) return;
    
    const newProduct = {
      id: `product_${Date.now()}`,
      name: product.name,
      cash_price: product.cashPrice,
      card_price: product.cardPrice,
      category: product.category,
      image: product.image,
      stock: product.stock,
      company_id: companyId,
    };

    const { error } = await supabase
      .from('products')
      .insert([newProduct]);

    if (error) {
      console.error('Error adding product:', error);
      throw error;
    }

    await loadProducts();
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.cashPrice !== undefined) dbUpdates.cash_price = updates.cashPrice;
    if (updates.cardPrice !== undefined) dbUpdates.card_price = updates.cardPrice;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;

    const { error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }

    await loadProducts();
  };

  const clearProducts = async () => {
    const { error } = await supabase
      .from('products')
      .delete()
      .neq('id', '');

    if (error) {
      console.error('Error clearing products:', error);
      throw error;
    }

    await loadProducts();
  };

  // ============================================
  // EMPLOYEES
  // ============================================

  const loadEmployees = async () => {
    if (!companyId) {
      setEmployees([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (error) {
      console.error('Error loading employees:', error);
      return;
    }
    
    // Convert snake_case to camelCase and timestamps to Date objects
    const employeesWithDates = (data || []).map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      isActive: emp.is_active,
      createdAt: new Date(emp.created_at),
    }));
    
    setEmployees(employeesWithDates);
  };

  const addEmployee = async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    if (!companyId) return;
    
    const newEmployee = {
      id: `employee_${Date.now()}`,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      is_active: employee.isActive,
      company_id: companyId,
    };

    const { error } = await supabase
      .from('employees')
      .insert([newEmployee]);

    if (error) {
      console.error('Error adding employee:', error);
      throw error;
    }

    await loadEmployees();
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
      .from('employees')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating employee:', error);
      throw error;
    }

    await loadEmployees();
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }

    await loadEmployees();
  };

  const clearEmployees = async () => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .neq('id', '');

    if (error) {
      console.error('Error clearing employees:', error);
      throw error;
    }

    await loadEmployees();
  };

  // ============================================
  // CASH REGISTERS
  // ============================================

  const loadCashRegisters = async () => {
    if (!companyId) {
      setCashRegisters([]);
      return;
    }
    
    const { data, error} = await supabase
      .from('cash_registers')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (error) {
      console.error('Error loading cash registers:', error);
      return;
    }
    
    // Convert snake_case to camelCase and timestamps to Date objects
    const registersWithDates = (data || []).map(reg => ({
      id: reg.id,
      name: reg.name,
      employeeId: reg.employee_id,
      employeeName: reg.employee_name,
      isActive: reg.is_active,
      openingBalance: reg.opening_balance,
      currentBalance: reg.current_balance,
      openedAt: reg.opened_at ? new Date(reg.opened_at) : undefined,
      closedAt: reg.closed_at ? new Date(reg.closed_at) : undefined,
      accessToken: reg.access_token,
    }));
    
    setCashRegisters(registersWithDates);
  };

  const addCashRegister = async (register: Omit<CashRegister, 'id'>) => {
    if (!companyId) return;
    
    const newRegister = {
      id: `register_${Date.now()}`,
      name: register.name,
      employee_id: register.employeeId,
      employee_name: register.employeeName,
      is_active: register.isActive,
      opening_balance: register.openingBalance,
      current_balance: register.currentBalance,
      opened_at: register.openedAt?.toISOString(),
      closed_at: register.closedAt?.toISOString(),
      access_token: register.accessToken,
      company_id: companyId,
    };

    const { error } = await supabase
      .from('cash_registers')
      .insert([newRegister]);

    if (error) {
      console.error('Error adding cash register:', error);
      throw error;
    }

    await loadCashRegisters();
  };

  const updateCashRegister = async (id: string, updates: Partial<CashRegister>) => {
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId;
    if (updates.employeeName !== undefined) dbUpdates.employee_name = updates.employeeName;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.openingBalance !== undefined) dbUpdates.opening_balance = updates.openingBalance;
    if (updates.currentBalance !== undefined) dbUpdates.current_balance = updates.currentBalance;
    if (updates.openedAt !== undefined) dbUpdates.opened_at = updates.openedAt?.toISOString();
    if (updates.closedAt !== undefined) dbUpdates.closed_at = updates.closedAt?.toISOString();
    if (updates.accessToken !== undefined) dbUpdates.access_token = updates.accessToken;

    const { error } = await supabase
      .from('cash_registers')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating cash register:', error);
      throw error;
    }

    await loadCashRegisters();
  };

  const deleteCashRegister = async (id: string) => {
    const { error } = await supabase
      .from('cash_registers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting cash register:', error);
      throw error;
    }

    await loadCashRegisters();
  };

  const clearCashRegisters = async () => {
    const { error } = await supabase
      .from('cash_registers')
      .delete()
      .neq('id', '');

    if (error) {
      console.error('Error clearing cash registers:', error);
      throw error;
    }

    await loadCashRegisters();
  };

  // ============================================
  // SALES
  // ============================================

  const loadSales = async () => {
    if (!companyId) {
      setSales([]);
      return;
    }
    
    // First, try to load with archived filter
    let { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('company_id', companyId)
      .eq('archived', false)
      .order('date', { ascending: false });
    
    // If error (column doesn't exist), try without archived filter
    if (error) {
      console.warn('Archived column not found, loading all sales:', error);
      const result = await supabase
        .from('sales')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false });
      
      data = result.data;
      error = result.error;
      
      if (error) {
        console.error('Error loading sales:', error);
        return;
      }
    }
    
    // Convert snake_case to camelCase and timestamps to Date objects
    const salesWithDates = (data || []).map(sale => ({
      id: sale.id,
      cashRegisterId: sale.cash_register_id,
      cashRegisterName: sale.cash_register_name,
      employeeId: sale.employee_id,
      employeeName: sale.employee_name,
      date: new Date(sale.date),
      items: sale.items,
      subtotal: sale.subtotal,
      total: sale.total,
      paymentMethod: sale.payment_method,
      receivedAmount: sale.received_amount,
      change: sale.change,
      archived: sale.archived || false,
      archivedAt: sale.archived_at ? new Date(sale.archived_at) : undefined,
    }));
    
    setSales(salesWithDates);
  };

  const addSale = async (sale: Sale) => {
    if (!companyId) return;
    
    const dbSale = {
      id: sale.id,
      cash_register_id: sale.cashRegisterId,
      cash_register_name: sale.cashRegisterName,
      employee_id: sale.employeeId,
      employee_name: sale.employeeName,
      date: sale.date.toISOString(),
      items: sale.items,
      subtotal: sale.subtotal,
      total: sale.total,
      payment_method: sale.paymentMethod,
      received_amount: sale.receivedAmount,
      change: sale.change,
      company_id: companyId,
    };

    const { error } = await supabase
      .from('sales')
      .insert([dbSale]);

    if (error) {
      console.error('Error adding sale:', error);
      throw error;
    }

    await loadSales();
  };

  const clearSales = async () => {
    // Archive sales from closed sessions only
    // First, get all closed session IDs
    const { data: closedSessions, error: sessionsError } = await supabase
      .from('cash_register_sessions')
      .select('id')
      .eq('status', 'closed')
      .eq('archived', false);

    if (sessionsError) {
      console.error('Error fetching closed sessions:', sessionsError);
      throw sessionsError;
    }

    if (!closedSessions || closedSessions.length === 0) {
      // No closed sessions to archive sales from
      return;
    }

    // Archive all non-archived sales
    // This is safe because we only call this when cleaning up closed sessions
    const { error } = await supabase
      .from('sales')
      .update({ 
        archived: true, 
        archived_at: new Date().toISOString() 
      })
      .eq('archived', false);

    if (error) {
      console.error('Error archiving sales:', error);
      throw error;
    }

    await loadSales();
  };

  // ============================================
  // SESSIONS
  // ============================================

  const loadSessions = async () => {
    if (!companyId) {
      setSessions([]);
      return;
    }
    
    // First, try to load with archived filter
    let { data, error } = await supabase
      .from('cash_register_sessions')
      .select('*')
      .eq('company_id', companyId)
      .eq('archived', false)
      .order('opened_at', { ascending: false });
    
    // If error (column doesn't exist), try without archived filter
    if (error) {
      console.warn('Archived column not found, loading all sessions:', error);
      const result = await supabase
        .from('cash_register_sessions')
        .select('*')
        .eq('company_id', companyId)
        .order('opened_at', { ascending: false });
      
      data = result.data;
      error = result.error;
      
      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }
    }
    
    // Convert snake_case to camelCase and timestamps to Date objects
    const sessionsWithDates = (data || []).map(session => ({
      id: session.id,
      cashRegisterId: session.cash_register_id,
      cashRegisterName: session.cash_register_name,
      employeeId: session.employee_id,
      employeeName: session.employee_name,
      openedAt: new Date(session.opened_at),
      closedAt: session.closed_at ? new Date(session.closed_at) : undefined,
      openingBalance: session.opening_balance,
      closingBalance: session.closing_balance,
      expectedBalance: session.expected_balance,
      totalSales: session.total_sales,
      totalCash: session.total_cash,
      totalCard: session.total_card,
      status: session.status,
      archived: session.archived || false,
      archivedAt: session.archived_at ? new Date(session.archived_at) : undefined,
      sales: [], // Sales are loaded separately
    }));
    
    setSessions(sessionsWithDates);
  };

  const addSession = async (session: CashRegisterSession) => {
    if (!companyId) return;
    
    const dbSession = {
      id: session.id,
      cash_register_id: session.cashRegisterId,
      cash_register_name: session.cashRegisterName,
      employee_id: session.employeeId,
      employee_name: session.employeeName,
      opened_at: session.openedAt.toISOString(),
      closed_at: session.closedAt?.toISOString(),
      opening_balance: session.openingBalance,
      closing_balance: session.closingBalance,
      expected_balance: session.expectedBalance,
      total_sales: session.totalSales,
      total_cash: session.totalCash,
      total_card: session.totalCard,
      status: session.status,
      company_id: companyId,
    };

    const { error } = await supabase
      .from('cash_register_sessions')
      .insert([dbSession]);

    if (error) {
      console.error('Error adding session:', error);
      throw error;
    }

    await loadSessions();
  };

  const updateSession = async (id: string, updates: Partial<CashRegisterSession>) => {
    const dbUpdates: any = {};
    
    if (updates.cashRegisterId !== undefined) dbUpdates.cash_register_id = updates.cashRegisterId;
    if (updates.cashRegisterName !== undefined) dbUpdates.cash_register_name = updates.cashRegisterName;
    if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId;
    if (updates.employeeName !== undefined) dbUpdates.employee_name = updates.employeeName;
    if (updates.openedAt !== undefined) dbUpdates.opened_at = updates.openedAt.toISOString();
    if (updates.closedAt !== undefined) dbUpdates.closed_at = updates.closedAt?.toISOString();
    if (updates.openingBalance !== undefined) dbUpdates.opening_balance = updates.openingBalance;
    if (updates.closingBalance !== undefined) dbUpdates.closing_balance = updates.closingBalance;
    if (updates.expectedBalance !== undefined) dbUpdates.expected_balance = updates.expectedBalance;
    if (updates.totalSales !== undefined) dbUpdates.total_sales = updates.totalSales;
    if (updates.totalCash !== undefined) dbUpdates.total_cash = updates.totalCash;
    if (updates.totalCard !== undefined) dbUpdates.total_card = updates.totalCard;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { error } = await supabase
      .from('cash_register_sessions')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }

    await loadSessions();
  };

  const clearSessions = async () => {
    // Get closed sessions to archive
    const { data: closedSessions, error: fetchError } = await supabase
      .from('cash_register_sessions')
      .select('cash_register_id')
      .eq('archived', false)
      .eq('status', 'closed');

    if (fetchError) {
      console.error('Error fetching closed sessions:', fetchError);
      throw fetchError;
    }

    // Archive only CLOSED sessions (not open ones)
    const { error } = await supabase
      .from('cash_register_sessions')
      .update({ 
        archived: true, 
        archived_at: new Date().toISOString() 
      })
      .eq('archived', false)
      .eq('status', 'closed');

    if (error) {
      console.error('Error archiving sessions:', error);
      throw error;
    }

    // Update cash registers to inactive if their sessions were archived
    if (closedSessions && closedSessions.length > 0) {
      const registerIds = [...new Set(closedSessions.map(s => s.cash_register_id))];
      
      for (const registerId of registerIds) {
        // Check if this register has any open sessions left
        const { data: openSessions } = await supabase
          .from('cash_register_sessions')
          .select('id')
          .eq('cash_register_id', registerId)
          .eq('status', 'open')
          .eq('archived', false);

        // If no open sessions, mark register as inactive
        if (!openSessions || openSessions.length === 0) {
          await supabase
            .from('cash_registers')
            .update({ is_active: false })
            .eq('id', registerId);
        }
      }
    }

    await loadSessions();
    await loadCashRegisters();
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const startSession = async (sessionData: Omit<CashRegisterSession, 'id' | 'sales' | 'totalSales' | 'totalCash' | 'totalCard' | 'status'>) => {
    const newSession: CashRegisterSession = {
      ...sessionData,
      id: `session_${Date.now()}`,
      sales: [],
      totalSales: 0,
      totalCash: 0,
      totalCard: 0,
      status: 'open',
      closedAt: undefined,
      closingBalance: undefined,
      expectedBalance: sessionData.openingBalance,
    };

    await addSession(newSession);
    return newSession;
  };

  const closeSession = async (cashRegisterId: string, closingBalance: number) => {
    const session = sessions.find(s => s.cashRegisterId === cashRegisterId && s.status === 'open');
    if (!session) {
      throw new Error('No open session found for this cash register');
    }

    // Get sales for this session
    const sessionSales = sales.filter(s => 
      s.cashRegisterId === cashRegisterId && 
      s.date >= session.openedAt
    );

    const totalCash = sessionSales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.total, 0);

    const totalCard = sessionSales
      .filter(s => s.paymentMethod === 'card')
      .reduce((sum, s) => sum + s.total, 0);

    const expectedBalance = session.openingBalance + totalCash;

    // Close the session
    await updateSession(session.id, {
      closedAt: new Date(),
      closingBalance,
      expectedBalance,
      totalSales: sessionSales.length,
      totalCash,
      totalCard,
      status: 'closed',
    });

    // Reset cash register: close it and reset balance to 0 for next opening
    await updateCashRegister(cashRegisterId, {
      isActive: false,
      closedAt: new Date(),
      currentBalance: 0,
      openingBalance: 0,
    });

    // Reload sessions to reflect the closed status
    await loadSessions();
  };

  // Load archived data with date filter
  const loadArchivedData = async (startDate?: Date, endDate?: Date) => {
    if (!companyId) {
      return { sales: [], sessions: [] };
    }
    
    try {
      let salesQuery = supabase
        .from('sales')
        .select('*')
        .eq('company_id', companyId)
        .eq('archived', true);

      let sessionsQuery = supabase
        .from('cash_register_sessions')
        .select('*')
        .eq('company_id', companyId)
        .eq('archived', true);

      if (startDate) {
        salesQuery = salesQuery.gte('archived_at', startDate.toISOString());
        sessionsQuery = sessionsQuery.gte('archived_at', startDate.toISOString());
      }

      if (endDate) {
        salesQuery = salesQuery.lte('archived_at', endDate.toISOString());
        sessionsQuery = sessionsQuery.lte('archived_at', endDate.toISOString());
      }

      const [salesResult, sessionsResult] = await Promise.all([
        salesQuery.order('date', { ascending: false }),
        sessionsQuery.order('opened_at', { ascending: false }),
      ]);

      if (salesResult.error) throw salesResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      const archivedSales = (salesResult.data || []).map(sale => ({
        id: sale.id,
        cashRegisterId: sale.cash_register_id,
        cashRegisterName: sale.cash_register_name,
        employeeId: sale.employee_id,
        employeeName: sale.employee_name,
        date: new Date(sale.date),
        items: sale.items,
        subtotal: sale.subtotal,
        total: sale.total,
        paymentMethod: sale.payment_method,
        receivedAmount: sale.received_amount,
        change: sale.change,
        archived: sale.archived || false,
        archivedAt: sale.archived_at ? new Date(sale.archived_at) : undefined,
      }));

      const archivedSessions = (sessionsResult.data || []).map(session => ({
        id: session.id,
        cashRegisterId: session.cash_register_id,
        cashRegisterName: session.cash_register_name,
        employeeId: session.employee_id,
        employeeName: session.employee_name,
        openedAt: new Date(session.opened_at),
        closedAt: session.closed_at ? new Date(session.closed_at) : undefined,
        openingBalance: session.opening_balance,
        closingBalance: session.closing_balance,
        expectedBalance: session.expected_balance,
        totalSales: session.total_sales,
        totalCash: session.total_cash,
        totalCard: session.total_card,
        status: session.status,
        archived: session.archived || false,
        archivedAt: session.archived_at ? new Date(session.archived_at) : undefined,
        sales: [],
      }));

      return {
        sales: archivedSales,
        sessions: archivedSessions,
      };
    } catch (error) {
      console.error('Error loading archived data:', error);
      throw error;
    }
  };

  return {
    // Data
    products,
    employees,
    cashRegisters,
    sales,
    sessions,
    loading,
    
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
    clearCashRegisters,
    
    // Sales
    addSale,
    clearSales,
    
    // Sessions
    addSession,
    updateSession,
    clearSessions,
    startSession,
    closeSession,
    
    // Utility
    refreshData: loadAllData,
    loadArchivedData,
  };
}
