/**
 * MercadoPago Mock Service
 * Simula pagos con tarjeta para desarrollo/testing
 * Usar solo cuando no tengas un posnet real o credenciales válidas
 */

import { PaymentResult } from './mercadopago';

/**
 * Simula un pago con tarjeta exitoso
 */
export async function mockCardPayment(
  amount: number,
  description: string,
  _externalReference?: string
): Promise<PaymentResult> {
  console.log('🧪 MODO SIMULACIÓN - Pago con tarjeta');
  console.log(`💰 Monto: $${amount}`);
  console.log(`📝 Descripción: ${description}`);
  
  // Simular delay de procesamiento (3 segundos)
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Simular éxito (90% de probabilidad)
  const success = Math.random() > 0.1;
  
  if (success) {
    console.log('✅ Pago simulado exitoso');
    return {
      success: true,
      paymentId: `mock_${Date.now()}`,
      status: 'FINISHED',
      amount: amount,
      transactionDetails: {
        mock: true,
        timestamp: new Date().toISOString(),
      }
    };
  } else {
    console.log('❌ Pago simulado rechazado');
    return {
      success: false,
      error: 'Pago rechazado (simulación)',
      status: 'ERROR',
    };
  }
}

/**
 * Verifica si debe usar modo simulación
 */
export function shouldUseMockPayments(): boolean {
  // Usar mock si estamos en desarrollo Y no hay credenciales
  const isDev = import.meta.env.DEV;
  const useMock = localStorage.getItem('use_mock_payments') === 'true';
  
  return isDev || useMock;
}

/**
 * Habilitar/deshabilitar modo simulación
 */
export function setMockPayments(enabled: boolean) {
  if (enabled) {
    localStorage.setItem('use_mock_payments', 'true');
    console.log('🧪 Modo simulación de pagos HABILITADO');
  } else {
    localStorage.removeItem('use_mock_payments');
    console.log('💳 Modo simulación de pagos DESHABILITADO');
  }
}
