import '@react-native-firebase/app';
import messaging, {
  getMessaging,
  getToken,
  deleteToken,
  onTokenRefresh,
  requestPermission,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, Alert, Linking } from 'react-native';
import { supabase } from './supabase';
import { strings } from '../strings';

const getMessagingInstance = () => {
  try {
    if (typeof getMessaging === 'function') {
      const inst = getMessaging();
      if (inst) return inst;
    }
  } catch (e: any) {
    console.warn('[push] getMessaging() failed:', e?.message || e);
  }

  try {
    if (typeof messaging === 'function') {
      const inst = (messaging as any)();
      if (inst) return inst;
    }
    if (messaging && typeof (messaging as any).getToken === 'function') {
      return messaging as any;
    }
  } catch (e: any) {
    console.warn('[push] messaging() failed:', e?.message || e);
  }

  try {
    const req = require('@react-native-firebase/messaging');
    if (typeof req.getMessaging === 'function') {
      const inst = req.getMessaging();
      if (inst) return inst;
    }
    const msgFunc = req?.default || req;
    if (typeof msgFunc === 'function') {
      const inst = msgFunc();
      if (inst) return inst;
    }
  } catch (e: any) {
    console.warn('[push] require messaging failed:', e?.message || e);
  }

  return null;
};

const safeGetToken = async (inst: any): Promise<string | null> => {
  if (!inst) throw new Error('Messaging instance is null');
  if (typeof getToken === 'function') {
    return await getToken(inst);
  } else if (typeof inst.getToken === 'function') {
    return await inst.getToken();
  }
  throw new Error('getToken method not available');
};

const safeDeleteToken = async (inst: any): Promise<void> => {
  if (!inst) return;
  if (typeof deleteToken === 'function') {
    await deleteToken(inst);
  } else if (typeof inst.deleteToken === 'function') {
    await inst.deleteToken();
  }
};

const safeOnTokenRefresh = (inst: any, callback: (token: string) => void) => {
  if (!inst) return () => {};
  if (typeof onTokenRefresh === 'function') {
    return onTokenRefresh(inst, callback);
  } else if (typeof inst.onTokenRefresh === 'function') {
    return inst.onTokenRefresh(callback);
  }
  return () => {};
};

const safeRequestPermission = async (inst: any): Promise<any> => {
  if (!inst) return null;
  if (typeof requestPermission === 'function') {
    return await requestPermission(inst);
  } else if (typeof inst.requestPermission === 'function') {
    return await inst.requestPermission();
  }
  return null;
};

const safeOnNotificationOpenedApp = (inst: any, callback: (remoteMessage: any) => void) => {
  if (!inst) return () => {};
  if (typeof onNotificationOpenedApp === 'function') {
    return onNotificationOpenedApp(inst, callback);
  } else if (typeof inst.onNotificationOpenedApp === 'function') {
    return inst.onNotificationOpenedApp(callback);
  }
  return () => {};
};

const safeGetInitialNotification = async (inst: any): Promise<any> => {
  if (!inst) return null;
  if (typeof getInitialNotification === 'function') {
    return await getInitialNotification(inst);
  } else if (typeof inst.getInitialNotification === 'function') {
    return await inst.getInitialNotification();
  }
  return null;
};

const getNotifee = () => {
  try {
    if (notifee && typeof notifee === 'object' && !(notifee as any).default) {
      return notifee;
    }
    if (notifee && (notifee as any).default) {
      return (notifee as any).default;
    }
    if (typeof notifee === 'function') {
      return (notifee as any)();
    }
  } catch (e: any) {
    console.warn('[boot] Error getting notifee instance:', e?.message || e);
  }
  return null;
};

export async function requestNotificationPermission() {
  console.log('[boot] notifications init start');
  try {
    const notifeeInst = getNotifee();
    const msgInst = getMessagingInstance();

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      if (notifeeInst && typeof notifeeInst.requestPermission === 'function') {
        console.log('[boot] requesting permission via notifee...');
        const settings = await notifeeInst.requestPermission();
        console.log('[boot] notifee settings received:', settings?.authorizationStatus);
        const deniedStatus = notifeeInst.AuthorizationStatus?.DENIED ?? 0;
        if (settings.authorizationStatus === deniedStatus) {
          Alert.alert(
            strings.notifications.permissionDeniedTitle,
            strings.notifications.permissionDeniedSub,
            [
              { text: strings.general.cancel, style: 'cancel' },
              { text: strings.notifications.openSettings, onPress: () => Linking.openSettings() },
            ]
          );
          console.log('[boot] notifications init end (permission denied)');
          return false;
        }
      }
    } else if (msgInst) {
      console.log('[boot] requesting permission via messaging...');
      const authStatus = await safeRequestPermission(msgInst);
      console.log('[boot] messaging auth status received:', authStatus);
      const enabled = authStatus === 1 || authStatus === 2;
      if (!enabled) {
        console.log('[boot] notifications init end (permission not authorized)');
        return false;
      }
    }
    console.log('[boot] notifications init end (permission granted)');
    return true;
  } catch (e: any) {
    console.warn('[boot] requestNotificationPermission error:', e?.message || e);
    console.log('[boot] notifications init end (error)');
    return false;
  }
}

export async function createNotificationChannel() {
  try {
    if (Platform.OS === 'android') {
      const notifeeInst = getNotifee();
      if (notifeeInst && typeof notifeeInst.createChannel === 'function') {
        await notifeeInst.createChannel({
          id: 'messages_v2',
          name: 'Messages',
          importance: AndroidImportance?.HIGH ?? 4,
          sound: 'default',
          vibration: true,
        });
      }
    }
  } catch (e: any) {
    console.warn('[boot] createNotificationChannel error:', e?.message || e);
  }
}

export async function registerDeviceToken(userId: string) {
  console.log('[push] registering...');
  try {
    console.log('[push] checking permission...');
    const hasPermission = await requestNotificationPermission();
    console.log('[push] permission result:', hasPermission);
    if (!hasPermission) {
      console.log('[push] permission denied or not granted, skipping token fetch');
      return;
    }

    const msgInst = getMessagingInstance();
    if (!msgInst) {
      console.log('[push] messaging instance unavailable');
      return;
    }

    console.log('[push] getting FCM token...');

    const fetchTokenWithTimeout = async (): Promise<string | null> => {
      const inst = getMessagingInstance();
      const tokenPromise = safeGetToken(inst);
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('getToken timed out after 15s')), 15000)
      );
      return (await Promise.race([tokenPromise, timeoutPromise])) as string | null;
    };

    let token: string | null = null;
    try {
      token = await fetchTokenWithTimeout();
    } catch (err: any) {
      console.log(`[push] getToken failed (${err?.code || 'NO_CODE'}: ${err?.message || err}), attempting deleteToken fallback...`);
      try {
        const inst = getMessagingInstance();
        if (inst) {
          console.log('[push] calling deleteToken fallback...');
          await safeDeleteToken(inst);
          console.log('[push] deleteToken complete, retrying getToken...');
        }
        token = await fetchTokenWithTimeout();
      } catch (retryErr: any) {
        console.log(`[push] retry getToken failed (${retryErr?.code || 'NO_CODE'}: ${retryErr?.message || retryErr})`);
      }
    }

    console.log('[push] token fetch completed, token present:', !!token);

    if (token && userId) {
      console.log(`[push] token: ${token.substring(0, 12)}...`);
      console.log('[push] saving token to Supabase via RPC...');
      const { error } = await supabase.rpc('register_device_token', {
        p_token: token,
        p_platform: Platform.OS,
      });
      console.log(`[push] save error: ${error ? `${error.code || ''} ${error.message}` : 'null'}`);
    } else {
      console.log('[push] token or userId missing, token:', token ? 'exists' : 'null', 'userId:', userId || 'null');
    }
  } catch (e: any) {
    console.log(`[push] save error: ${e?.code ? `[${e.code}] ` : ''}${e?.message || e}`);
  }
}

export function listenForTokenRefresh(userId: string) {
  try {
    const msgInst = getMessagingInstance();
    if (msgInst) {
      return safeOnTokenRefresh(msgInst, async (token: string) => {
        if (token && userId) {
          console.log(`[push] token: ${token.substring(0, 12)}...`);
          const { error } = await supabase.rpc('register_device_token', {
            p_token: token,
            p_platform: Platform.OS,
          });
          console.log(`[push] save error: ${error ? `${error.code || ''} ${error.message}` : 'null'}`);
        }
      });
    }
  } catch (e: any) {
    console.warn('[push] listenForTokenRefresh error:', e?.message || e);
  }
  return () => {};
}

export async function unregisterDeviceToken() {
  try {
    const msgInst = getMessagingInstance();
    if (msgInst) {
      const token = await safeGetToken(msgInst).catch(() => null);
      if (token) {
        await supabase.from('device_tokens').delete().eq('token', token);
      }
      await safeDeleteToken(msgInst).catch(() => {});
    }
  } catch (e: any) {
    console.warn('[push] unregisterDeviceToken error:', e?.message || e);
  }
}

export const upsertDeviceToken = registerDeviceToken;
export const deleteDeviceToken = unregisterDeviceToken;
export const setupTokenRefreshListener = listenForTokenRefresh;

export function setupNotificationOpenedListener(navigationRef: any) {
  try {
    const msgInst = getMessagingInstance();
    if (msgInst) {
      safeOnNotificationOpenedApp(msgInst, (remoteMessage: any) => {
        if (navigationRef?.isReady?.()) {
          const convId = remoteMessage?.data?.conversationId;
          if (convId) {
            navigationRef.navigate('Chat', { conversationId: convId });
          }
        }
      });

      safeGetInitialNotification(msgInst)
        .then((remoteMessage: any) => {
          if (remoteMessage && navigationRef?.isReady?.()) {
            const convId = remoteMessage?.data?.conversationId;
            if (convId) {
              navigationRef.navigate('Chat', { conversationId: convId });
            }
          }
        })
        .catch((err: any) => console.warn('[boot] getInitialNotification error:', err?.message || err));
    }
  } catch (e: any) {
    console.warn('[boot] setupNotificationOpenedListener error:', e?.message || e);
  }
}
