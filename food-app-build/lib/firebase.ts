import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
};

// Check if we have valid-looking project info
const isConfigAvailable = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'mock-project'
);

let app: any = null;

if (typeof window !== 'undefined') {
  try {
    if (getApps().length > 0) {
      app = getApp();
    } else if (isConfigAvailable) {
      app = initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.error("Firebase init error:", e);
  }
}

export const getFcmToken = async () => {
  if (!app || typeof window === 'undefined') return null;
  try {
    const messaging = getMessaging(app);
    // Return null immediately if no VAPID key to avoid internal Firebase errors
    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || !isConfigAvailable) return null;
    
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    return token;
  } catch (error) {
    console.warn("FCM Token skipped:", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!app) return resolve(null);
    try {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } catch (e) {
      resolve(null);
    }
  });

export { app };
