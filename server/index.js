const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(cors());
app.use(express.json());

// Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Obtener credenciales de MercadoPago
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
    storeId: data.mercadopago_store_id,
    posId: data.mercadopago_pos_id
  };
}

// ======================================================
// ===========  POS SMART A12 - CHECKOUT =================
// ======================================================
app.post('/api/pos/order/create', async (req, res) => {
  try {
    const { amount, description, externalReference, companyId, posId, storeId } = req.body;

    console.log("📥 Request POS A12:", {
      amount, description, externalReference, companyId, posId, storeId
    });

    const credentials = await getMercadoPagoCredentials(companyId);

    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: 'No se encontraron las credenciales de la empresa.'
      });
    }

    // --------------------------------------------------
    //  1. CONFIGURAR STORE_ID Y POS_ID
    // --------------------------------------------------
    const finalStoreId = credentials.storeId || storeId || 'STORE001';
    const finalPosId = parseInt(credentials.posId || posId || '1');

    console.log("🔧 Configuración POS:", {
      storeId: finalStoreId,
      posId: finalPosId
    });

    // --------------------------------------------------
    //  2. PAYLOAD OFICIAL PARA POINT API
    // --------------------------------------------------
    const payload = {
      own_id: externalReference,
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: Number(amount)
        }
      ],
      additional_info: {
        store_id: finalStoreId,
        pos_id: finalPosId
      }
    };

    console.log("📤 Payload a Mercado Pago:", JSON.stringify(payload, null, 2));

    // --------------------------------------------------
    //  3. ENVÍO AL POS SMART A12 - API CORRECTA
    // --------------------------------------------------
    const url = 'https://api.mercadopago.com/v1/in_person_payments/point/orders';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log("🟣 Respuesta POS MercadoPago:", data);

    if (!response.ok || data.error) {
      return res.status(response.status || 400).json({
        success: false,
        error: data.message || data.error || 'Error enviando orden al POS A12',
        details: data
      });
    }

    // --------------------------------------------------
    //  4. TODO OK – RESPUESTA AL FRONTEND
    // --------------------------------------------------
    return res.json({
      success: true,
      order: data
    });

  } catch (error) {
    console.error("❌ ERROR POS:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint POS A12: /api/pos/order/create`);
});
