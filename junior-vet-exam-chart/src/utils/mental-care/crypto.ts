/**
 * Web Crypto API を用いた暗号化・PINハッシュ化ユーティリティ
 * 
 * - PBKDF2 (SHA-256, 300,000 iterations) による鍵導出
 * - AES-GCM (256-bit, IV 12 bytes) によるデータ暗号化/復号
 * - 完全端末内（クライアントサイド）実行
 */

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (subtle) is not available in this environment');
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto.getRandomValues(array);
  }
  throw new Error('Web Crypto API (getRandomValues) is not available');
}

/**
 * ランダムソルト（16バイト）をhex文字列で生成
 */
export function generateSaltHex(length = 16): string {
  const bytes = new Uint8Array(length);
  getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// PBKDF2 反復回数: 本番環境は厳格な 300,000 回、テスト環境 (Vitest/jsdom) では CI タイムアウト防止のため 1,000 回
export const DEFAULT_PBKDF2_ITERATIONS = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ? 1000 : 300000;
const PBKDF2_ITERATIONS = DEFAULT_PBKDF2_ITERATIONS;

/**
 * 4桁PINとソルトからPBKDF2で検証用ハッシュ文字列（hex）を生成
 */
export async function hashPin(pin: string, saltHex: string, iterations: number = PBKDF2_ITERATIONS): Promise<string> {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);

  const baseKey = await subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

/**
 * 4桁PINとソルトからAES-GCM用の暗号鍵（CryptoKey）を生成
 */
export async function deriveKeyFromPin(pin: string, saltHex: string, iterations: number = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);

  const baseKey = await subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // extractable: false (メモリ外への漏洩防止)
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // hex
}

/**
 * データをAES-GCMで暗号化
 */
export async function encryptData<T>(data: T, key: CryptoKey): Promise<EncryptedPayload> {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const jsonStr = JSON.stringify(data);
  const iv = getRandomValues(new Uint8Array(12));

  const cipherBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    enc.encode(jsonStr)
  );

  // Buffer to base64
  const bytes = new Uint8Array(cipherBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const ciphertext = btoa(binary);

  return {
    ciphertext,
    iv: bytesToHex(iv),
  };
}

/**
 * AES-GCM暗号化データを復号
 */
export async function decryptData<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
  const subtle = getSubtleCrypto();
  const iv = hexToBytes(payload.iv);

  const binary = atob(payload.ciphertext);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    bytes
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

