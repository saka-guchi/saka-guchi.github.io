import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';

// jsdom 環境（特にCI/Linux）で Web Crypto API を確実に提供
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
      value: webcrypto,
      writable: true,
      configurable: true,
    });
  } else if (!window.crypto.subtle) {
    Object.defineProperty(window.crypto, 'subtle', {
      value: webcrypto.subtle,
      writable: true,
      configurable: true,
    });
  }
}

if (typeof globalThis !== 'undefined') {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      writable: true,
      configurable: true,
    });
  } else if (!globalThis.crypto.subtle) {
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: webcrypto.subtle,
      writable: true,
      configurable: true,
    });
  }
}
