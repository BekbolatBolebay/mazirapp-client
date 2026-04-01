import { NextResponse } from 'next/server';
import { messaging } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { token, title, body, url } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    console.log('[API Notifications] Sending background notification:', { token: token.substring(0, 10) + '...', title });

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: {
        url: url || '/',
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-light-32x32.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
        },
        fcmOptions: {
          link: url || '/',
        },
      },
    };

    const response = await messaging.send(message);
    console.log('[API Notifications] Successfully sent message:', response);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('[API Notifications] Error sending notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}
