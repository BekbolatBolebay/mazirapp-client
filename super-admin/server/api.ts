import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID, createHash } from 'crypto';
import webpush from 'web-push';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.SERVER_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... (existing Supabase init code)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Configure web-push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Push] Web-push configured');
}

// Configure Firebase Admin
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (process.env.FIREBASE_PROJECT_ID && firebasePrivateKey) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: firebasePrivateKey,
        }),
      });
      console.log('[Push] Firebase Admin initialized');
    }
  } catch (error) {
    console.error('[Push] Firebase Admin init error:', error);
  }
}

// ==================== PAYMENT HELPERS ====================

function generateFreedomSignature(
  scriptName: string,
  params: Record<string, any>,
  secretKey: string
): string {
  const sortedKeys = Object.keys(params).sort();
  let signatureString = scriptName;

  for (const key of sortedKeys) {
    const value = params[key];
    if (value === null || value === undefined) continue;
    signatureString += ';' + String(value);
  }

  signatureString += ';' + secretKey;
  return createHash('md5').update(signatureString).digest('hex');
}

// ==================== PAYMENT ENDPOINTS ====================

/**
 * POST /api/payments/init-subscription - Initialize a subscription payment
 */
app.post('/api/payments/init-subscription', async (req: Request, res: Response) => {
  try {
    const { cafeId, planId, planName, amount } = req.body;

    if (!cafeId || !planId || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 1. Create a pending payment record
    const { data: payRecord, error: payError } = await supabase
      .from('subscription_payments')
      .insert({
        cafe_id: cafeId,
        plan_id: planId,
        plan_name: planName || 'Subscription',
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();

    if (payError) throw payError;

    // 2. Prepare Freedom Pay parameters
    const merchantId = process.env.FREEDOM_MERCHANT_ID;
    const secretKey = process.env.FREEDOM_PAYMENT_SECRET_KEY;

    if (!merchantId || !secretKey) {
      throw new Error('Freedom Pay credentials not configured in Super Admin');
    }

    const pg_params: any = {
      pg_merchant_id: merchantId,
      pg_amount: amount,
      pg_currency: 'KZT',
      pg_order_id: payRecord.id,
      pg_description: `Məzir Subscription: ${planName}`,
      pg_salt: randomUUID().substring(0, 8),
      pg_language: 'ru',
      pg_result_url: `${process.env.VITE_API_URL}/payments/webhook`,
      pg_success_url: `https://admin.mazir.kz/profile?status=success`, // Placeholder for client redirect
      pg_failure_url: `https://admin.mazir.kz/profile?status=failure`,
    };

    pg_params.pg_sig = generateFreedomSignature('init_payment.php', pg_params, secretKey);

    const redirectUrl = `https://api.freedompay.kz/init_payment.php?${new URLSearchParams(pg_params).toString()}`;

    res.json({ redirectUrl });

  } catch (error: any) {
    console.error('❌ Init payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/webhook - Handle Freedom Pay webhook
 */
app.post('/api/payments/webhook', async (req: Request, res: Response) => {
  try {
    // Note: Freedom Pay usually sends data as Form Data (POST)
    const params = req.body;
    console.log('📍 Webhook received:', params);

    const secretKey = process.env.FREEDOM_PAYMENT_SECRET_KEY;
    if (!secretKey) throw new Error('Secret key not configured');

    // 1. Verify signature
    const { pg_sig, ...otherParams } = params;
    const expectedSig = generateFreedomSignature('webhook', otherParams, secretKey);

    if (pg_sig !== expectedSig) {
      console.error('❌ Invalid signature for webhook');
      return res.status(400).send('Invalid signature');
    }

    const isSuccess = params.pg_result === '1';
    const paymentId = params.pg_order_id;
    const pgPaymentId = params.pg_payment_id;

    if (isSuccess) {
      // 2. Update payment record
      const { data: subPay, error: subError } = await supabase
        .from('subscription_payments')
        .update({
          status: 'success',
          freedom_payment_id: pgPaymentId,
          pg_sig: pg_sig
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (subError) throw subError;

      // 3. Update restaurant expiry date
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('expiry_date, plan')
        .eq('id', subPay.cafe_id)
        .single();

      let currentExpiry = restaurant?.expiry_date ? new Date(restaurant.expiry_date) : new Date();
      if (currentExpiry < new Date()) currentExpiry = new Date();

      const newExpiry = new Date(currentExpiry);
      if (subPay.plan_name.toLowerCase().includes('year')) {
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
      } else {
        newExpiry.setMonth(newExpiry.getMonth() + 1);
      }

      const { error: resError } = await supabase
        .from('restaurants')
        .update({
          expiry_date: newExpiry.toISOString(),
          platform_status: 'active',
          plan: subPay.plan_name
        })
        .eq('id', subPay.cafe_id);

      if (resError) throw resError;

      console.log(`✅ Subscription extended for ${subPay.cafe_id} until ${newExpiry.toISOString()}`);
    } else {
      await supabase
        .from('subscription_payments')
        .update({ status: 'failure' })
        .eq('id', paymentId);
    }

    // Freedom Pay expects XML response
    const responseSig = generateFreedomSignature('webhook', { pg_status: 'ok', pg_salt: params.pg_salt }, secretKey);
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <pg_status>ok</pg_status>
  <pg_salt>${params.pg_salt}</pg_salt>
  <pg_sig>${responseSig}</pg_sig>
</response>`;

    res.set('Content-Type', 'application/xml');
    res.send(xmlResponse);

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(500).send(error.message);
  }
});

// Initialize Supabase client
const supabaseUrl = process.env.POSTGRES_URL?.split('/')[0]?.replace(/^postgres/, 'https') || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set. Please configure it in .env');
  process.exit(1);
}

// Parse real Supabase URL
const dbUrl = process.env.POSTGRES_URL || '';
const matches = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
let realSupabaseUrl = 'https://wuhefcbofaoqvsrejcjc.supabase.co';

if (process.env.SUPABASE_URL) {
  realSupabaseUrl = process.env.SUPABASE_URL;
}

const supabase = createClient(realSupabaseUrl, supabaseKey);

// Type definitions
interface Cafe {
  id: string; // Changed from number to string (UUID)
  name: string;
  logo: string;
  city: string;
  address: string;
  description?: string;
  workHours?: string;
  plan: string;
  status: 'active' | 'warning' | 'expired' | 'blocked';
  expiry: string;
  blockUntil?: string | null;
  blockReason?: string | null;
  notifications?: Array<{ subject: string; message: string; createdAt: string }>;
}

interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  period: 'month' | 'year';
  status: boolean;
  createdAt: string;
}

// ==================== CAFE ENDPOINTS ====================

/**
 * GET /api/cafes - Get all cafes (mapped from restaurants)
 */
app.get('/api/cafes', async (req: Request, res: Response) => {
  try {
    console.log('📍 GET /api/cafes - Requesting from restaurants table');

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch cafes', details: error });
    }

    // Map restaurants to the Cafe interface expected by the Super Admin frontend
    const mappedData = data.map((r: any) => ({
      id: r.id, // Now a UUID string
      name: r.name_ru || r.name_kk || r.name_en,
      logo: r.image_url || 'https://via.placeholder.com/100',
      city: r.address?.split(',')[0] || 'Unknown',
      address: r.address || '',
      description: r.description_ru || r.description_kk || '',
      plan: r.plan || 'Basic',
      status: r.platform_status || 'active',
      expiry: r.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      blockUntil: r.block_until,
      blockReason: r.block_reason,
      notifications: [] // Placeholder
    }));

    res.json(mappedData);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/cafes/:id - Get single cafe
 */
app.get('/api/cafes/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Cafe not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch cafe' });
    }

    const mapped = {
      id: data.id,
      name: data.name_ru || data.name_kk || data.name_en,
      logo: data.image_url || 'https://via.placeholder.com/100',
      city: data.address?.split(',')[0] || 'Unknown',
      address: data.address || '',
      description: data.description_ru || data.description_kk || '',
      plan: data.plan || 'Basic',
      status: data.platform_status || 'active',
      expiry: data.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      blockUntil: data.block_until,
      blockReason: data.block_reason,
      notifications: []
    };

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/cafes/:id/block - Block a cafe
 */
app.post('/api/cafes/:id/block', async (req: Request, res: Response) => {
  try {
    const { blockDays, blockReason } = req.body;
    const cafeId = req.params.id; // UUID string

    const until = new Date();
    until.setDate(until.getDate() + blockDays);

    const { data, error } = await supabase
      .from('restaurants')
      .update({
        platform_status: 'blocked',
        block_until: until.toISOString(),
        block_reason: blockReason || null,
      })
      .eq('id', cafeId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Cafe not found' });
      }
      return res.status(500).json({ error: 'Failed to block cafe' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/cafes/:id/unblock - Unblock a cafe
 */
app.post('/api/cafes/:id/unblock', async (req: Request, res: Response) => {
  try {
    const cafeId = req.params.id; // UUID string

    const { data, error } = await supabase
      .from('restaurants')
      .update({
        platform_status: 'active',
        block_until: null,
        block_reason: null,
      })
      .eq('id', cafeId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Cafe not found' });
      }
      return res.status(500).json({ error: 'Failed to unblock cafe' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/cafes/:id/plan - Update cafe plan
 */
app.put('/api/cafes/:id/plan', async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const cafeId = req.params.id; // UUID string

    // Get subscription to get its name
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('name')
      .eq('id', planId)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { data, error } = await supabase
      .from('restaurants')
      .update({ plan: subscription.name })
      .eq('id', cafeId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Cafe not found' });
      }
      return res.status(500).json({ error: 'Failed to update plan' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/cafes/:id/notify - Send notification to cafe
 */
app.post('/api/cafes/:id/notify', async (req: Request, res: Response) => {
  try {
    const { subject, message, url } = req.body;
    const cafeId = req.params.id;

    // 1. Verify restaurant exists
    const { data: cafe, error: cafeError } = await supabase
      .from('restaurants')
      .select('id, name_ru')
      .eq('id', cafeId)
      .single();

    if (cafeError || !cafe) {
      return res.status(404).json({ error: 'Cafe not found' });
    }

    // 2. Find admins of this cafe
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('push_subscription, fcm_token')
      .eq('cafe_id', cafeId);

    if (staffError || !staff || staff.length === 0) {
      return res.json({ success: true, message: 'No admins found to notify' });
    }

    const payload = {
      title: subject || 'Mazir Platform',
      body: message || 'У вас новое уведомление',
      url: url || '/profile',
    };

    const pushPromises: Promise<any>[] = [];

    for (const adminProfile of staff) {
      // Web-Push
      if (adminProfile.push_subscription && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        try {
          const subObj = typeof adminProfile.push_subscription === 'string'
            ? JSON.parse(adminProfile.push_subscription)
            : adminProfile.push_subscription;
          
          pushPromises.push(webpush.sendNotification(subObj, JSON.stringify(payload)));
        } catch (e) {
          console.error('[Push] Web-push error for admin:', e);
        }
      }

      // FCM
      if (adminProfile.fcm_token && admin.apps.length > 0) {
        try {
          const fcmMessage = {
            token: adminProfile.fcm_token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: {
              url: payload.url,
            },
          };
          pushPromises.push(admin.messaging().send(fcmMessage));
        } catch (e) {
          console.error('[Push] FCM error for admin:', e);
        }
      }
    }

    await Promise.allSettled(pushPromises);
    console.log(`Notification sent to admins of ${cafe.name_ru}: ${subject}`);

    res.json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/cafes/:id - Delete a cafe
 */
app.delete('/api/cafes/:id', async (req: Request, res: Response) => {
  try {
    const cafeId = req.params.id;

    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', cafeId);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to delete cafe' });
    }

    res.json({ success: true, message: 'Cafe deleted' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CATEGORY ENDPOINTS ====================

/**
 * GET /api/categories/standard - Get all standard categories (cafe_id is null)
 */
app.get('/api/categories/standard', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('cafe_id', null)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/categories/standard - Create standard category
 */
app.post('/api/categories/standard', async (req: Request, res: Response) => {
  try {
    const { name_kk, name_ru, name_en, icon_url, sort_order, is_active } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: randomUUID(),
        name_kk,
        name_ru,
        name_en: name_en || name_ru,
        icon_url,
        sort_order: sort_order || 0,
        is_active: is_active ?? true,
        cafe_id: null
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/categories/standard/:id - Update standard category
 */
app.put('/api/categories/standard/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(req.body)
      .eq('id', req.params.id)
      .is('cafe_id', null)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/categories/standard/:id - Delete standard category
 */
app.delete('/api/categories/standard/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id)
      .is('cafe_id', null);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/cafes/:id/categories - Assign standard categories to a cafe
 */
app.post('/api/cafes/:id/categories', async (req: Request, res: Response) => {
  try {
    const cafeId = req.params.id;
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ error: 'categoryIds must be an array' });
    }

    // 1. Fetch the selected standard categories
    const { data: standardCats, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .in('id', categoryIds)
      .is('cafe_id', null);

    if (fetchError) throw fetchError;

    // 2. Insert them as cafe-specific categories
    const newCategories = standardCats.map(cat => ({
      id: randomUUID(),
      name_kk: cat.name_kk,
      name_ru: cat.name_ru,
      name_en: cat.name_en,
      icon_url: cat.icon_url,
      sort_order: cat.sort_order,
      is_active: true,
      cafe_id: cafeId
    }));

    const { error: insertError } = await supabase
      .from('categories')
      .insert(newCategories);

    if (insertError) throw insertError;

    res.json({ success: true, count: newCategories.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SUBSCRIPTION ENDPOINTS ====================

/**
 * GET /api/subscriptions - Get all subscriptions
 */
app.get('/api/subscriptions', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*');

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/subscriptions/:id - Get single subscription
 */
app.get('/api/subscriptions/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/subscriptions - Create subscription
 */
app.post('/api/subscriptions', async (req: Request, res: Response) => {
  try {
    console.log('📍 POST /api/subscriptions - Creating subscription');
    const { name, description, price, period, status } = req.body;

    // Generate UUID for ID if not provided
    const id = req.body.id || randomUUID();
    console.log('🔑 Generated ID:', id);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        id, // ✅ ВАЖНО: ID обязателен для PRIMARY KEY
        name,
        description,
        price,
        period,
        status,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Failed to create subscription', details: error });
    }

    console.log('✅ Subscription created:', data);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : error });
  }
});

/**
 * PUT /api/subscriptions/:id - Update subscription
 */
app.put('/api/subscriptions/:id', async (req: Request, res: Response) => {
  try {
    console.log('📍 PUT /api/subscriptions/:id - Updating subscription', req.params.id);

    const { data, error } = await supabase
      .from('subscriptions')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Failed to update subscription', details: error });
    }

    console.log('✅ Subscription updated:', data);
    res.json(data);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/subscriptions/:id - Delete subscription
 */
app.delete('/api/subscriptions/:id', async (req: Request, res: Response) => {
  try {
    console.log('📍 DELETE /api/subscriptions/:id - Deleting subscription', req.params.id);

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Failed to delete subscription', details: error });
    }

    console.log('✅ Subscription deleted:', req.params.id);
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', async (req: Request, res: Response) => {
  try {
    console.log('\n🏥 HEALTH CHECK');
    console.log('🔌 Supabase URL:', realSupabaseUrl);
    console.log('🔑 Service Role Key present:', !!supabaseKey);

    // Test database connection
    const { data, error } = await supabase.from('restaurants').select('count()', { count: 'exact' });

    if (error) {
      console.error('❌ Database connection failed:', error);
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'failed',
          url: realSupabaseUrl,
          error: error.message,
        },
      });
      return;
    }

    console.log('✅ Database connected');
    console.log('📊 Restaurant records count:', data?.length || 0);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        url: realSupabaseUrl,
        restaurantCount: data?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
app.listen(port, () => {
  console.log('\n🚀 Server started');
  console.log('📍 API running at http://localhost:' + port);
  console.log('📝 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('🗄️  Supabase URL: ' + realSupabaseUrl);
  console.log('✅ All endpoints connected to database\n');
});
