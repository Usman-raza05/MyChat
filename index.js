/**
 * @format
 */

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encoding = 'utf-8';
    encode(input = '') {
      const binString = unescape(encodeURIComponent(input));
      return Uint8Array.from(binString, (char) => char.charCodeAt(0));
    }
    encodeInto(source, destination) {
      const buf = this.encode(source);
      destination.set(buf);
      return { read: source.length, written: buf.length };
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    encoding = 'utf-8';
    fatal = false;
    ignoreBOM = false;
    constructor(label = 'utf-8') {
      this.encoding = label;
    }
    decode(input) {
      if (!input) return '';
      let bytes;
      if (input instanceof Uint8Array) {
        bytes = input;
      } else if (ArrayBuffer.isView(input)) {
        bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      } else if (input instanceof ArrayBuffer) {
        bytes = new Uint8Array(input);
      } else {
        bytes = new Uint8Array(input);
      }
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      try {
        return decodeURIComponent(escape(binary));
      } catch (e) {
        return binary;
      }
    }
  };
}

try {
  require('react-native-gesture-handler');
} catch (e) {
  // Optional gesture handler
}

import '@react-native-firebase/app';
import messaging, { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('[boot] index.js loaded');

const registerBackgroundMessageHandler = (handler) => {
  try {
    const inst = typeof getMessaging === 'function' ? getMessaging() : (typeof messaging === 'function' ? messaging() : messaging);
    if (typeof setBackgroundMessageHandler === 'function' && inst) {
      setBackgroundMessageHandler(inst, handler);
      console.log('[boot] Registered FCM background handler successfully (modular)');
      return;
    }
    if (inst && typeof inst.setBackgroundMessageHandler === 'function') {
      inst.setBackgroundMessageHandler(handler);
      console.log('[boot] Registered FCM background handler successfully (legacy)');
      return;
    }
  } catch (err) {
    console.warn('[boot] Unable to register setBackgroundMessageHandler:', err?.message || err);
  }
};

registerBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[boot] Background FCM message handled:', remoteMessage?.messageId);
});

try {
  const notifeeObj = typeof notifee === 'function' ? notifee() : (notifee?.default || notifee);
  if (notifeeObj && typeof notifeeObj.onBackgroundEvent === 'function') {
    notifeeObj.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType?.PRESS && detail?.notification) {
        console.log('[boot] Background Notifee event handled:', detail.notification.id);
      }
    });
    console.log('[boot] Registered Notifee onBackgroundEvent');
  } else {
    console.warn('[boot] notifee.onBackgroundEvent is not available');
  }
} catch (error) {
  console.error('[boot] Error registering onBackgroundEvent:', error);
}

AppRegistry.registerComponent(appName, () => App);
