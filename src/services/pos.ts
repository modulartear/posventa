/**
 * MercadoPago POS (Point Smart) Integration Service
 * Handles communication with backend for physical POS device payments
 */

const SERVER_URL = import.meta.env.VITE_POS_SERVER_URL || 'http://localhost:3001';

export interface PosOrderData {
  amount: number;
  description: string;
  externalReference: string;
  companyId: string;
  posId?: string;
  storeId?: string;
}

export interface PosOrderResult {
  success: boolean;
  order?: any;
  error?: string;
}

/**
 * Create a POS order (sends payment to physical device)
 */
export async function createPosOrder(data: PosOrderData): Promise<PosOrderResult> {
  try {
    console.log('🔵 Creando orden POS para dispositivo físico...');
    console.log(`💰 Monto: $${data.amount}`);
    console.log(`📝 Descripción: ${data.description}`);

    const response = await fetch(`${SERVER_URL}/api/pos/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        description: data.description,
        externalReference: data.externalReference,
        companyId: data.companyId,
        posId: data.posId || 'POS001',
        storeId: data.storeId || 'STORE001',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Error del servidor:', errorData);
      return {
        success: false,
        error: errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const result = await response.json();
    console.log('✅ Orden POS creada:', result.order?.id);

    return {
      success: true,
      order: result.order,
    };
  } catch (error: any) {
    console.error('❌ Error creando orden POS:', error);
    return {
      success: false,
      error: error.message || 'Error de conexión con el servidor',
    };
  }
}

/**
 * Get available POS devices
 */
export async function getPosDevices(companyId: string) {
  try {
    const response = await fetch(`${SERVER_URL}/api/pos/devices?companyId=${companyId}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener dispositivos POS');
    }

    const result = await response.json();
    return result.devices || [];
  } catch (error) {
    console.error('❌ Error obteniendo dispositivos POS:', error);
    return [];
  }
}

/**
 * Create a dynamic QR code (for customer to scan with MercadoPago app)
 */
export interface QROrderData {
  amount: number;
  description: string;
  externalReference: string;
  companyId: string;
}

export interface QROrderResult {
  success: boolean;
  orderId?: string;
  qrData?: string;
  externalReference?: string;
  error?: string;
}

export async function createQROrder(data: QROrderData): Promise<QROrderResult> {
  try {
    console.log('🔵 Creando QR dinámico...');
    console.log(`💰 Monto: $${data.amount}`);
    console.log(`📝 Descripción: ${data.description}`);

    const response = await fetch(`${SERVER_URL}/api/qr/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        description: data.description,
        externalReference: data.externalReference,
        companyId: data.companyId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Error del servidor:', errorData);
      return {
        success: false,
        error: errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const result = await response.json();
    console.log('✅ QR creado:', result.orderId);

    return {
      success: true,
      orderId: result.orderId,
      qrData: result.qrData,
      externalReference: result.externalReference,
    };
  } catch (error: any) {
    console.error('❌ Error creando QR:', error);
    return {
      success: false,
      error: error.message || 'Error de conexión con el servidor',
    };
  }
}

/**
 * Check QR payment status
 */
export async function checkQRStatus(externalReference: string) {
  try {
    const response = await fetch(`${SERVER_URL}/api/qr/status/${externalReference}`);
    
    if (!response.ok) {
      throw new Error('Error al verificar estado del QR');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error verificando estado del QR:', error);
    return null;
  }
}
