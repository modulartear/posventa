import { supabase } from '../lib/supabase';
import { Customer, CustomerPoints, SelectedCustomer } from '../types';

export interface CustomerInput {
  name?: string;
  dni?: string;
  email?: string;
  phone?: string;
}

function mapCustomer(row: any): Customer {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name || undefined,
    dni: row.dni || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    qrCode: row.qr_code,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
  };
}

function mapCustomerPoints(row: any): CustomerPoints {
  return {
    id: row.id,
    customerId: row.customer_id,
    companyId: row.company_id,
    pointsBalance: row.points_balance ?? 0,
    lifetimePoints: row.lifetime_points ?? 0,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

async function fetchCustomerPoints(companyId: string, customerId: string): Promise<CustomerPoints | null> {
  const { data, error } = await supabase
    .from('customer_points')
    .select('*')
    .eq('company_id', companyId)
    .eq('customer_id', customerId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapCustomerPoints(data);
}

export async function getOrCreateCustomerPoints(companyId: string, customerId: string): Promise<CustomerPoints> {
  return ensureCustomerPoints(companyId, customerId);
}

async function ensureCustomerPoints(companyId: string, customerId: string): Promise<CustomerPoints> {
  const existing = await fetchCustomerPoints(companyId, customerId);
  if (existing) return existing;

  const payload = {
    company_id: companyId,
    customer_id: customerId,
    points_balance: 0,
    lifetime_points: 0,
  };

  const { data, error } = await supabase
    .from('customer_points')
    .insert([payload])
    .select('*')
    .single();

  if (error || !data) {
    throw error || new Error('No se pudo crear el registro de puntos');
  }

  return mapCustomerPoints(data);
}

export async function getCustomerByQr(
  companyId: string,
  qrCode: string
): Promise<SelectedCustomer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .eq('qr_code', qrCode)
    .single();

  if (error || !data) {
    return null;
  }

  const customer = mapCustomer(data);
  const points = await fetchCustomerPoints(companyId, customer.id);

  return { customer, points };
}

export async function getCustomerByDni(
  companyId: string,
  dni: string
): Promise<SelectedCustomer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .eq('dni', dni)
    .single();

  if (error || !data) {
    return null;
  }

  const customer = mapCustomer(data);
  const points = await fetchCustomerPoints(companyId, customer.id);

  return { customer, points };
}

export async function registerCustomerByDni(
  companyId: string,
  input: Required<Pick<CustomerInput, 'dni'>> & Omit<CustomerInput, 'dni'>
): Promise<SelectedCustomer> {
  // Intentar encontrar cliente existente por DNI para esta empresa
  const existing = await getCustomerByDni(companyId, input.dni);
  if (existing) {
    // Actualizar datos básicos si cambiaron (nombre, email, teléfono)
    const { customer } = existing;

    const updatePayload: any = {
      name: input.name ?? customer.name ?? null,
      email: input.email ?? customer.email ?? null,
      phone: input.phone ?? customer.phone ?? null,
    };

    const { data, error } = await supabase
      .from('customers')
      .update(updatePayload)
      .eq('id', customer.id)
      .select('*')
      .single();

    if (!error && data) {
      const updatedCustomer = mapCustomer(data);
      const points = await ensureCustomerPoints(companyId, updatedCustomer.id);
      return { customer: updatedCustomer, points };
    }

    // Si falla la actualización, devolvemos el existente
    return existing;
  }

  // Si no existe, crear nuevo cliente
  return await createCustomer(companyId, input);
}

export async function createCustomer(
  companyId: string,
  input: CustomerInput
): Promise<SelectedCustomer> {
  const qrCode = `CUS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const payload = {
    company_id: companyId,
    name: input.name || null,
    dni: input.dni || null,
    email: input.email || null,
    phone: input.phone || null,
    qr_code: qrCode,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert([payload])
    .select('*')
    .single();

  if (error || !data) {
    throw error || new Error('No se pudo crear el cliente');
  }

  const customer = mapCustomer(data);
  const points = await ensureCustomerPoints(companyId, customer.id);

  return { customer, points };
}

export async function upsertCustomerPoints(
  companyId: string,
  customerId: string,
  pointsChange: number,
  overrideBalance?: number
): Promise<CustomerPoints> {
  const entry = await ensureCustomerPoints(companyId, customerId);
  const newBalance =
    overrideBalance !== undefined ? Math.max(0, overrideBalance) : Math.max(0, entry.pointsBalance + pointsChange);

  const updated = {
    points_balance: newBalance,
    lifetime_points: entry.lifetimePoints + Math.max(0, pointsChange),
  };

  const { data, error } = await supabase
    .from('customer_points')
    .update(updated)
    .eq('id', entry.id)
    .select('*')
    .single();

  if (error || !data) {
    throw error || new Error('No se pudo actualizar los puntos');
  }

  return mapCustomerPoints(data);
}
