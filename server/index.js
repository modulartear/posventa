/**
 * Backend Server for MercadoPago QR + POS (Point Smart)
 * Versión unificada y compatible 2024–2025
 */

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// -----------------------------
//  CORS
// -----------------------------
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(cors());
app.use(express.json());

// -----------------------------
//  Supabase
// -----------------------------
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Memoria temporal para QR
const pendingPayments = new Map();

// -----------------------------
//  Credenciales por empresa
// -----------------------------
async function getMercadoPagoCredentials(companyId) {
  const { data, error } = await supabase
    .from('api_settings')
    .select(
      'mercadopago_access_token, mercadopago_public_key, mercadopago_enabled, mercadopago_user_id, mercadopago_store_id, mercadopago_pos_id'
    )
    .eq('company_id', companyId)
    .single();

  if (error || !data || !data.mercadopago_enabled) return null;

  return {
    accessToken: data.mercadopago_access_token,
    publicKey: data.mercadopago_public_key,
    userId: data.mercadopago_user_id,
    storeId: data.mercadopago_store_id || 'STORE001',
    posId: data.mercadopago_pos_id || 'POS001'
  };
}

/* --------------------------------------------------------------------------
   🟣   1) QR Dinámico
-------------------------------------------------------------------------- */

app.post('/api/qr/create', async (req, res) => {
  try {
    const { amount, description, externalReference, companyId } = req.body;

    const credentials = await getMercadoPagoCredentials(companyId);
    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: 'MercadoPago no está configurado para esta empresa'
      });
    }

    const url = `https://api.mercadopago.com/instore/qr/seller/collectors/${credentials.userId}/pos/${externalReference}/qrs`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_reference: externalReference,
        title: description,
        description,
        total_amount: amount,
        items: [
          {
            sku_number: 'item-001',
            category: 'marketplace',
            title: description,
            description,
            unit_price: amount,
            quantity: 1,
            unit_measure: 'unit',
            total_amount: amount
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: 'Error al crear QR',
        details: await response.text()
      });
    }

    const order = await response.json();

    pendingPayments.set(externalReference, {
      orderId: order.qr_data,
      amount,
      description,
      companyId,
      status: 'pending',
      createdAt: new Date()
    });

    res.json({
      success: true,
      orderId: order.qr_data,
      qrData: order.qr_data,
      externalReference
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------------------------
   🔔 WEBHOOK QR (forma vieja QR)
-------------------------------------------------------------------------- */
app.post('/api/qr/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;

      for (const [reference, payment] of pendingPayments.entries()) {
        if (payment.status === 'pending') {
          const credentials = await getMercadoPagoCredentials(payment.companyId);
          if (!credentials) continue;

          const resp = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
          );

          if (resp.ok) {
            const paymentData = await resp.json();

            if (paymentData.external_reference === reference) {
              if (paymentData.status === 'approved') {
                payment.status = 'approved';
                payment.paymentId = paymentId;
              } else if (paymentData.status === 'rejected') {
                payment.status = 'rejected';
              }
              pendingPayments.set(reference, payment);
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

/* --------------------------------------------------------------------------
   📊 Consultar estado de pago QR
-------------------------------------------------------------------------- */
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
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* --------------------------------------------------------------------------
   🟣   2) Obtener dispositivos POS (Point Smart)
-------------------------------------------------------------------------- */
app.get('/api/pos/devices', async (req, res) => {
  try {
    const { companyId } = req.query;
    const credentials = await getMercadoPagoCredentials(companyId);

    if (!credentials)
      return res.status(400).json({ success: false, error: 'Credenciales no configuradas' });

    const response = await fetch('https://api.mercadopago.com/v1/pos', {
      headers: { Authorization: `Bearer ${credentials.accessToken}` }
    });

    const devices = await response.json();
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------------------------
   🟣   3) Crear ORDEN REAL para POS físico
-------------------------------------------------------------------------- */
app.post('/api/pos/order/create', async (req, res) => {
  try {
    const { amount, description, externalReference, companyId, posId, storeId } =
      req.body;

    console.log('📥 Request POS:', { amount, description, externalReference, companyId });

    const credentials = await getMercadoPagoCredentials(companyId);
    if (!credentials) {
      console.error('❌ Credenciales no encontradas para companyId:', companyId);
      return res.status(400).json({ error: 'MercadoPago no configurado' });
    }

    console.log('✅ Credenciales obtenidas:', {
      hasAccessToken: !!credentials.accessToken,
      tokenPrefix: credentials.accessToken?.substring(0, 15) + '...',
      posId: credentials.posId,
      storeId: credentials.storeId
    });

    // Usar los valores de las credenciales directamente
    const finalPosId = parseInt(credentials.posId);
    const finalStoreId = String(credentials.storeId);

    console.log('🔧 Valores finales:', {
      finalPosId,
      finalStoreId,
      posIdType: typeof finalPosId,
      storeIdType: typeof finalStoreId
    });

    const body = {
      own_id: externalReference,
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: amount
        }
      ],
      additional_info: {
        pos_id: finalPosId,
        store_id: finalStoreId
      }
    };

    console.log('📤 Body enviado a MP:', JSON.stringify(body, null, 2));

    const response = await fetch(
      'https://api.mercadopago.com/v1/in_person_payments/point/orders',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    console.log('🟣 Respuesta MP POS:', JSON.stringify(data, null, 2));

    // Verificar si hay error en la respuesta
    if (!response.ok || data.error) {
      console.error('❌ Error de MercadoPago:', data);
      return res.status(response.status || 400).json({ 
        success: false,
        error: data.message || data.error || 'Error al crear orden en el POS',
        details: data
      });
    }

    res.json({ success: true, order: data });
  } catch (err) {
    console.error('❌ Error en servidor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------------------------
   🔔 WEBHOOK POS (Point Smart con firma HMAC)
   Firma: x-signature: ts=...,v1=HASH
          x-request-id
-------------------------------------------------------------------------- */
app.post('/api/pos/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const orderId = req.body?.data?.id;

    if (!signature || !requestId || !orderId) {
      return res.status(400).send('missing headers');
    }

    const [tsPart, v1Part] = signature.split(',');
    const ts = tsPart.split('=')[1];
    const v1 = v1Part.split('=')[1];

    const manifest = `id:${orderId};request-id:${requestId};ts:${ts};`;

    const expected = crypto
      .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
      .update(manifest)
      .digest('hex');

    if (expected !== v1) {
      return res.status(401).send('invalid signature');
    }

    console.log('🟢 Actualización de orden POS:', req.body);

    return res.sendStatus(200);
  } catch (err) {
    res.status(500).send('error');
  }
});

/* --------------------------------------------------------------------------
   Health Check
-------------------------------------------------------------------------- */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    pendingPayments: pendingPayments.size
  });
});

/* --------------------------------------------------------------------------
   Iniciar servidor
-------------------------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook QR: /api/qr/webhook`);
  console.log(`📡 Webhook POS: /api/pos/webhook`);
});
