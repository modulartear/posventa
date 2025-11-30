import Dexie, { Table } from 'dexie';
import { Product, Employee, CashRegister, Sale, CashRegisterSession } from '../types';

export class POSDatabase extends Dexie {
  products!: Table<Product, string>;
  employees!: Table<Employee, string>;
  cashRegisters!: Table<CashRegister, string>;
  sales!: Table<Sale, string>;
  sessions!: Table<CashRegisterSession, string>;

  constructor() {
    super('POSDatabase');
    
    this.version(1).stores({
      products: 'id, name, category, stock, cashPrice, cardPrice',
      employees: 'id, name, email, role, isActive',
      cashRegisters: 'id, name, employeeId, accessToken, isActive',
      sales: 'id, cashRegisterId, employeeId, paymentMethod, date, total',
      sessions: 'id, cashRegisterId, status, openedAt, closedAt',
    });
  }
}

export const db = new POSDatabase();
