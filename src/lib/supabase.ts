import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = class TextEncoder {
    encoding = 'utf-8';
    encode(input = ''): Uint8Array {
      const binString = unescape(encodeURIComponent(input));
      return Uint8Array.from(binString, (char) => char.charCodeAt(0));
    }
    encodeInto(source: string, destination: Uint8Array): { read: number; written: number } {
      const buf = this.encode(source);
      destination.set(buf);
      return { read: source.length, written: buf.length };
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = class TextDecoder {
    encoding = 'utf-8';
    fatal = false;
    ignoreBOM = false;
    constructor(label = 'utf-8') {
      this.encoding = label;
    }
    decode(input?: ArrayBuffer | ArrayBufferView | Uint8Array): string {
      if (!input) return '';
      let bytes: Uint8Array;
      if (input instanceof Uint8Array) {
        bytes = input;
      } else if (ArrayBuffer.isView(input)) {
        bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      } else if (input instanceof ArrayBuffer) {
        bytes = new Uint8Array(input);
      } else {
        bytes = new Uint8Array(input as any);
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

const SUPABASE_URL = 'https://kcsmoviumoobobsyilgr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__FwNFpTmSBaJREVesp9AYA_AXdOBVv5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
