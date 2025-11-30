/**
 * MercadoPago QR Payment Service - Sin Backend
 * Llama directamente a la API de MercadoPago desde el frontend
 */

import { supabase } from '../lib/supabase';

export interface QRPaymentData {
  amount: number;
  description: string;
  externalReference?: string;
}

export interface QRPaymentResult {
  success: boolean;
  qrData?: string;
  paymentId?: string;
  externalReference?: string;
  status?: string;
  amount?: number;
  error?: string;
}

/**
 * Get MercadoPago credentials from Supabase
 */
async function getMercadoPagoCredentials(companyId: string) {
  const { data, error } = await supabase
    .from('api_settings')
    .select('mercadopago_access_token, mercadopago_public_key, mercadopago_enabled')
    .eq('company_id', companyId)
    .single();

  if (error || !data || !data.mercadopago_enabled) {
    return null;
  }

  return {
    accessToken: data.mercadopago_access_token,
    publicKey: data.mercadopago_public_key,
  };
}

/**
 * Create QR payment preference with MercadoPago
 */
export async function createQRPayment(
  data: QRPaymentData,
  companyId: string
): Promise<{ orderId: string; qrData: string }> {
  console.log('🔵 Creando preferencia de pago QR...');
  
  // Get credentials
  const credentials = await getMercadoPagoCredentials(companyId);
  
  if (!credentials || !credentials.accessToken) {
    throw new Error('MercadoPago no está configurado. Por favor configura tus credenciales en Configuración → API.');
  }

  const externalReference = data.externalReference || `qr_${Date.now()}`;
  
  // Create Payment Preference
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_reference: externalReference,
      items: [
        {
          title: data.description,
          quantity: 1,
          unit_price: data.amount,
          currency_id: 'ARS',
        }
      ],
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },
          { id: 'atm' }
        ],
        installments: 1,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error de MercadoPago:', errorText);
    throw new Error('Error al crear preferencia de pago');
  }

  const preference = await response.json();
  console.log('✅ Preferencia creada:', preference.id);

  return {
    orderId: preference.id,
    qrData: preference.init_point, // URL to convert to QR
  };
}

/**
 * Process QR payment
 */
export async function processQRPayment(
  amount: number,
  description: string,
  companyId: string,
  externalReference?: string
): Promise<QRPaymentResult> {
  try {
    console.log('🔵 Iniciando pago con QR de MercadoPago...');
    console.log(`💰 Monto: $${amount}`);
    console.log(`📝 Descripción: ${description}`);

    const extRef = externalReference || `qr_${Date.now()}`;
    
    // Create QR
    const { orderId, qrData } = await createQRPayment({
      amount,
      description,
      externalReference: extRef,
    }, companyId);

    console.log(`✅ QR creado: ${orderId}`);

    return {
      success: true,
      qrData: qrData,
      paymentId: orderId,
      externalReference: extRef,
      status: 'PENDING',
      amount: amount,
    };
  } catch (error: any) {
    console.error('❌ Error procesando pago QR:', error);
    return {
      success: false,
      error: error.message || 'Error al procesar el pago con QR',
      status: 'ERROR',
    };
  }
}
