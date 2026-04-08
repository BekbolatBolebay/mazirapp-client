import * as admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const isValidConfig = 
  firebaseAdminConfig.projectId && 
  firebaseAdminConfig.projectId !== 'mazir-app' &&
  firebaseAdminConfig.clientEmail &&
  firebaseAdminConfig.privateKey;

if (!admin.apps.length && isValidConfig) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig as any),
    });
    console.log('[Firebase Admin] Initialized successfully');
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error);
  }
} else if (!isValidConfig) {
  console.warn('[Firebase Admin] Skipping initialization: Missing or invalid credentials');
}

export const messaging = isValidConfig ? admin.messaging() : {
  send: async () => { console.warn('[Firebase Admin] Messaging mock: send() called but not initialized'); return 'mock-message-id'; },
  sendMulticast: async () => { console.warn('[Firebase Admin] Messaging mock: sendMulticast() called'); return { successCount: 0, failureCount: 0, responses: [] }; },
} as any;

export default admin;
