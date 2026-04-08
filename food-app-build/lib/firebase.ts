import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const getFcmToken = async () => {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messaging = getMessaging(app);
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
          console.warn("[FCM] Permission not granted");
          return null;
      }

      // Check for existing registration or register new one
      let registration: ServiceWorkerRegistration | undefined;
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Look for the firebase worker specifically
      registration = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw.js'));

      if (!registration) {
        console.log("[FCM] Registering firebase-messaging-sw.js...");
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/firebase-cloud-messaging-push-scope'
        });
      }

      // Wait for registration to be active
      if (!registration.active) {
          await new Promise<void>((resolve) => {
              const checkActive = () => {
                  if (registration?.active) resolve();
                  else setTimeout(checkActive, 100);
              };
              checkActive();
          });
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      return token;
    }
    return null;
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { app };
