/**
 * Backend Server for MercadoPago QR Integration
 * Handles QR generation and webhook notifications
 */

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Allow all origins with explicit headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// In-memory store for pending payments (in production, use Redis or DB)
const pendingPayments = new Map();

/**
 * Get MercadoPago credentials for a company
 */
async function getMercadoPagoCredentials(companyId) {
  const { data, error } = await supabase
    .from('api_settings')
    .select('mercadopago_access_token, mercadopago_public_key, mercadopago_enabled, mercadopago_user_id, mercadopago_store_id, mercadopago_pos_id')
    .eq('company_id', companyId)
    .single();

  if (error || !data || !data.mercadopago_enabled) {
    return null;
  }

  return {
    accessToken: data.mercadopago_access_token,
    publicKey: data.mercadopago_public_key,
    userId: data.mercadopago_user_id,
    storeId: data.mercadopago_store_id || 'STORE001',
    posId: data.mercadopago_pos_id || 'POS001',
  };
}

/**
 * POST /api/qr/create
 * Create QR payment
 */
app.post('/api/qr/create', async (req, res) => {
  try {
    console.log('📥 Received QR creation request');
    console.log('📦 Body:', req.body);
    console.log('🌐 Origin:', req.headers.origin);
    
    const { amount, description, externalReference, companyId } = req.body;

    console.log('🔵 Creating QR order:', { amount, description, externalReference, companyId });

    // Get credentials
    const credentials = await getMercadoPagoCredentials(companyId);
    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: 'MercadoPago no está configurado para esta empresa',
      });
    }

    console.log('🔵 Creating QR Dynamic Order...');

    // Create QR Dynamic Order (In-Store QR)
    // This generates a QR that can be displayed on screen
    const orderResponse = await fetch('https://api.mercadopago.com/instore/qr/seller/collectors/' + credentials.userId + '/pos/' + externalReference + '/qrs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_reference: externalReference,
        title: description,
        description: description,
        total_amount: amount,
        items: [
          {
            sku_number: 'item-001',
            category: 'marketplace',
            title: description,
            description: description,
            unit_price: amount,
            quantity: 1,
            unit_measure: 'unit',
            total_amount: amount,
          }
        ],
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('❌ Error creating QR order:', errorText);
      
      return res.status(orderResponse.status).json({
        success: false,
        error: 'Error al crear orden QR',
        details: errorText,
      });
    }

    const order = await orderResponse.json();
    console.log('✅ QR Order created:', order);

    // Store pending payment
    pendingPayments.set(externalReference, {
      orderId: order.qr_data || externalReference,
      amount,
      description,
      companyId,
      status: 'pending',
      createdAt: new Date(),
    });

    res.json({
      success: true,
      orderId: order.qr_data || externalReference,
      qrData: order.qr_data, // QR data to display
      externalReference,
    });
  } catch (error) {
    console.error('❌ Error creating QR:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
});

/**
 * POST /api/qr/webhook
 * Receive payment notifications from MercadoPago
 */
app.post('/api/qr/webhook', async (req, res) => {
  try {
    console.log('🔔 Webhook received:', JSON.stringify(req.body, null, 2));

    const { type, data } = req.body;

    // MercadoPago sends different types of notifications
    if (type === 'payment') {
      const paymentId = data.id;

      // Find payment by searching all pending payments
      let foundPayment = null;
      let foundReference = null;

      for (const [reference, payment] of pendingPayments.entries()) {
        if (payment.status === 'pending') {
          // Get credentials
          const credentials = await getMercadoPagoCredentials(payment.companyId);
          if (!credentials) continue;

          // Get payment status from MercadoPago
          const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
            },
          });

          if (response.ok) {
            const paymentData = await response.json();
            
            if (paymentData.external_reference === reference) {
              foundPayment = payment;
              foundReference = reference;
              
              console.log('💳 Payment found:', {
                reference,
                status: paymentData.status,
                amount: paymentData.transaction_amount,
              });

              // Update payment status
              if (paymentData.status === 'approved') {
                payment.status = 'approved';
                payment.paymentId = paymentId;
                payment.approvedAt = new Date();
                pendingPayments.set(reference, payment);
                console.log('✅ Payment approved:', reference);
              } else if (paymentData.status === 'rejected') {
                payment.status = 'rejected';
                pendingPayments.set(reference, payment);
                console.log('❌ Payment rejected:', reference);
              }
              
              break;
            }
          }
        }
      }

      if (!foundPayment) {
        console.warn('⚠️ Payment not found for ID:', paymentId);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.sendStatus(500);
  }
});

/**
 * GET /api/qr/status/:externalReference
 * Check payment status
 */
app.get('/api/qr/status/:externalReference', (req, res) => {
  try {
    const { externalReference } = req.params;
    const payment = pendingPayments.get(externalReference);

    if (!payment) {
      return res.json({
        success: false,
        status: 'not_found',
      });
    }

    res.json({
      success: payment.status === 'approved',
      status: payment.status,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
    });
  } catch (error) {
    console.error('❌ Error checking status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    pendingPayments: pendingPayments.size,
  });
});

/**
 * Test CORS
 */
app.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date(),
  });
});

/**
 * Create payment intent for card payment (MercadoPago Point)
 */
app.post('/api/card/create', async (req, res) => {
  try {
    console.log('💳 Creating card payment intent...');
    const { amount, description, externalReference, companyId } = req.body;

    if (!amount || !description || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Get credentials
    const credentials = await getMercadoPagoCredentials(companyId);
    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: 'MercadoPago no está configurado para esta empresa',
      });
    }

    // Create payment intent with MercadoPago Point API
    const response = await fetch('https://api.mercadopago.com/point/integration-api/payment-intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
        external_reference: externalReference,
        payment: {
          installments: 1,
          type: 'credit_card',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ MercadoPago error:', errorText);
      
      let errorMessage = 'Error al crear payment intent';
      if (response.status === 401) {
        errorMessage = 'Credenciales de MercadoPago inválidas';
      } else if (response.status === 404) {
        errorMessage = 'No se encontró un dispositivo Point vinculado';
      }
      
      return res.status(response.status).json({
        success: false,
        error: errorMessage,
        details: errorText,
      });
    }

    const result = await response.json();
    console.log('✅ Payment intent created:', result.id);

    res.json({
      success: true,
      paymentIntentId: result.id,
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
});

/**
 * Get payment intent status
 */
app.get('/api/card/status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing companyId',
      });
    }

    // Get credentials
    const credentials = await getMercadoPagoCredentials(companyId);
    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: 'MercadoPago no está configurado',
      });
    }

    // Get payment intent status
    const response = await fetch(
      `https://api.mercadopago.com/point/integration-api/payment-intents/${paymentIntentId}`,
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error getting payment status');
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/qr/webhook`);
  console.log(`💳 Card payment: http://localhost:${PORT}/api/card/create`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
