import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';

// jsdom 環境（特にCI/Linux）で Web Crypto API を安全・確実に提供
try {
  if (typeof window !== 'undefined') {
    try {
      // @ts-expect-error polyfill for jsdom
      window.crypto = webcrypto;
    } catch {
      try {
        Object.defineProperty(window, 'crypto', {
          value: webcrypto,
          writable: true,
          configurable: true,
        });
      } catch {
        try {
          Object.defineProperty(window.crypto, 'subtle', {
            value: webcrypto.subtle,
            writable: true,
            configurable: true,
          });
        } catch {
          // ignore
        }
      }
    }
  }
} catch (e) {
  console.warn('window.crypto polyfill error:', e);
}

try {
  if (typeof globalThis !== 'undefined') {
    try {
      // @ts-expect-error polyfill for jsdom
      globalThis.crypto = webcrypto;
    } catch {
      try {
        Object.defineProperty(globalThis, 'crypto', {
          value: webcrypto,
          writable: true,
          configurable: true,
        });
      } catch {
        // ignore
      }
    }
  }
} catch (e) {
  console.warn('globalThis.crypto polyfill error:', e);
}
