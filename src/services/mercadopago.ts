/**
 * MercadoPago Point Integration Service
 * Handles communication with MercadoPago Point devices for card payments
 */

import { supabase } from '../lib/supabase';
import { mockCardPayment, shouldUseMockPayments } from './mercadopago-mock';

// Cache for API settings to avoid multiple DB calls
let cachedSettings: { accessToken: string; publicKey: string; companyId: string } | null = null;

export interface PaymentIntentData {
  amount: number;
  description: string;
  externalReference?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  amount?: number;
  error?: string;
  transactionDetails?: any;
}

/**
 * Get MercadoPago credentials from database
 */
async function getMercadoPagoCredentials(companyId: string): Promise<{ accessToken: string; publicKey: string } | null> {
  // Return cached settings if available for the same company
  if (cachedSettings && cachedSettings.companyId === companyId) {
    return {
      accessToken: cachedSettings.accessToken,
      publicKey: cachedSettings.publicKey,
    };
  }

  try {
    const { data, error } = await supabase
      .from('api_settings')
      .select('mercadopago_access_token, mercadopago_public_key, mercadopago_enabled')
      .eq('company_id', companyId)
      .single();

    if (error || !data) {
      console.error('Error loading MercadoPago credentials:', error);
      return null;
    }

    if (!data.mercadopago_enabled) {
      console.error('MercadoPago is not enabled for this company');
      return null;
    }

    if (!data.mercadopago_access_token || !data.mercadopago_public_key) {
      console.error('MercadoPago credentials are not configured');
      return null;
    }

    // Cache the settings
    cachedSettings = {
      accessToken: data.mercadopago_access_token,
      publicKey: data.mercadopago_public_key,
      companyId,
    };

    return {
      accessToken: data.mercadopago_access_token,
      publicKey: data.mercadopago_public_key,
    };
  } catch (error) {
    console.error('Error fetching MercadoPago credentials:', error);
    return null;
  }
}

/**
 * Create a manual payment intent (no backend required)
 * Returns a mock payment intent ID for manual confirmation
 */
export async function createPaymentIntent(
  _data: PaymentIntentData,
  _companyId: string
): Promise<string> {
  console.log('💳 Pago con tarjeta - Confirmación manual');
  
  // Generate a unique payment intent ID
  const paymentIntentId = `manual_${Date.now()}`;
  
  // Return immediately - the cashier will confirm manually
  return paymentIntentId;
}

/**
 * Get payment status - Manual confirmation (no backend)
 */
export async function getPaymentStatus(
  paymentIntentId: string,
  _companyId: string
): Promise<PaymentResult> {
  // For manual payments, always return pending status
  // The cashier will confirm manually
  return {
    success: false,
    status: 'PENDING',
    paymentId: paymentIntentId,
  };
}

/**
 * Cancel a payment intent - Manual (no backend)
 */
export async function cancelPaymentIntent(
  _paymentIntentId: string,
  _companyId: string
): Promise<boolean> {
  // For manual payments, cancellation is always successful
  return true;
}

/**
 * Process a card payment through MercadoPago Point
 * This is the main function to use in your POS
 */
export async function processCardPayment(
  amount: number,
  description: string,
  companyId: string,
  externalReference?: string
): Promise<PaymentResult> {
  try {
    console.log('🔵 Iniciando pago con MercadoPago Point...');
    console.log(`💰 Monto: $${amount}`);
    console.log(`📝 Descripción: ${description}`);
    console.log(`🏢 Empresa ID: ${companyId}`);

    // Check if we should use mock payments
    const useMock = shouldUseMockPayments();
    if (useMock) {
      console.warn('⚠️ Usando modo SIMULACIÓN - No se conectará con MercadoPago real');
      return await mockCardPayment(amount, description, externalReference);
    }

    // Create payment intent
    const paymentIntentId = await createPaymentIntent({
      amount,
      description,
      externalReference,
    }, companyId);

    console.log(`✅ Payment Intent creado: ${paymentIntentId}`);
    console.log('⏳ Esperando confirmación del posnet...');

    // Poll for payment status (check every 2 seconds for up to 2 minutes)
    const maxAttempts = 60; // 2 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const status = await getPaymentStatus(paymentIntentId, companyId);
      
      if (status.status === 'FINISHED') {
        console.log('✅ Pago aprobado!');
        return {
          success: true,
          paymentId: status.paymentId,
          status: status.status,
          amount: status.amount,
          transactionDetails: status.transactionDetails,
        };
      }
      
      if (status.status === 'CANCELED' || status.status === 'ERROR') {
        console.log('❌ Pago cancelado o error');
        return {
          success: false,
          error: 'Payment was canceled or failed',
          status: status.status,
        };
      }

      attempts++;
      console.log(`⏳ Intento ${attempts}/${maxAttempts}...`);
    }

    // Timeout - cancel the payment
    console.log('⏱️ Timeout - cancelando pago...');
    await cancelPaymentIntent(paymentIntentId, companyId);
    
    return {
      success: false,
      error: 'Payment timeout - no response from device',
    };

  } catch (error) {
    console.error('❌ Error procesando pago:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if MercadoPago is configured for a company
 */
export async function isMercadoPagoConfigured(companyId: string): Promise<boolean> {
  const credentials = await getMercadoPagoCredentials(companyId);
  return credentials !== null;
}

/**
 * Get configuration status for a company
 */
export async function getMercadoPagoStatus(companyId: string) {
  const credentials = await getMercadoPagoCredentials(companyId);
  
  return {
    configured: credentials !== null,
    hasPublicKey: !!credentials?.publicKey,
    hasAccessToken: !!credentials?.accessToken,
  };
}

/**
 * Clear cached credentials (useful when settings are updated)
 */
export function clearCredentialsCache() {
  cachedSettings = null;
}
