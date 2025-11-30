export interface Company {
  id: string;
  name: string;
  subdomain: string;
  code: string;
  plan: 'free' | 'basic' | 'premium';
  isActive: boolean;
  maxCashRegisters: number;
  maxProducts: number;
  maxEmployees: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  id: string;
  name: string;
  cashPrice: number;
  cardPrice: number;
  category: string;
  image: string;
  stock: number;
  companyId?: string;
}

export interface CartItem extends Product {
  quantity: number;
  appliedPrice: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'cashier' | 'admin';
  isActive: boolean;
  createdAt: Date;
  companyId?: string;
}

export interface CashRegister {
  id: string;
  name: string;
  employeeId: string | null;
  employeeName: string;
  isActive: boolean;
  openingBalance: number;
  currentBalance: number;
  openedAt?: Date;
  closedAt?: Date;
  accessToken: string;
  companyId?: string;
}

export interface Sale {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'qr';
  receivedAmount?: number;
  change?: number;
  archived?: boolean;
  archivedAt?: Date;
  companyId?: string;
}

export type LoyaltyCalculationType = 'amount' | 'quantity';

export interface LoyaltyProgram {
  id: string;
  companyId: string;
  name: string;
  calculationType: LoyaltyCalculationType;
  pointsPerUnit: number;
  unitValue: number;
  minPurchase?: number;
  minItems?: number;
  isActive: boolean;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  companyId: string;
  name?: string;
  email?: string;
  phone?: string;
  qrCode: string;
  createdAt?: Date;
}

export interface CustomerPoints {
  id: string;
  customerId: string;
  companyId: string;
  pointsBalance: number;
  lifetimePoints: number;
  updatedAt?: Date;
}

export interface PointTransaction {
  id: string;
  companyId: string;
  customerId: string;
  saleId?: string;
  pointsChange: number;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface SelectedCustomer {
  customer: Customer;
  points?: CustomerPoints | null;
}

export interface CashRegisterSession {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  employeeId: string;
  employeeName: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  sales: Sale[];
  totalSales: number;
  totalCash: number;
  totalCard: number;
  status: 'open' | 'closed';
  archived?: boolean;
  archivedAt?: Date;
  companyId?: string;
}

export interface CompanySettings {
  companyId: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxId?: string;
  companyLogo?: string;
  adminUsername: string;
  adminPasswordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface APISettings {
  companyId: string;
  mercadopagoAccessToken?: string;
  mercadopagoPublicKey?: string;
  mercadopagoEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  companyId: string | null;
  companyCode: string | null;
}
