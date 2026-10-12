/**
 * Zero-Knowledge Vault Cryptographic Engine
 *
 * Implements Infisical-style End-to-End Encryption (E2EE) using native Web Crypto API.
 *
 * Key Principles:
 * 1. User Encryption Key (UEK) is derived client-side via PBKDF2 (SHA-256, 100,000 iterations).
 * 2. Asymmetric RSA-OAEP key pair represents user's identity.
 *    - Public key is shared for team key wrapping.
 *    - Private key is encrypted with UEK (AES-GCM) before being stored.
 * 3. Project Key (AES-256-GCM) is generated client-side and wrapped for each authorized member's public key.
 * 4. Secrets & Files are encrypted with the Project Key using AES-256-GCM.
 * 5. Neither plain secrets, private keys, nor project keys are EVER sent to the server.
 */

// ==========================================
// Base64 & Buffer Conversion Helpers
// ==========================================

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function generateRandomSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bufferToBase64(bytes);
}

export function generateRandomIv(length = 12): Uint8Array {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

// ==========================================
// User Encryption Key (UEK) & PBKDF2
// ==========================================

export async function deriveUserEncryptionKey(
  passphrase: string,
  saltBase64: string,
  iterations = 100000,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = base64ToBuffer(saltBase64);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// ==========================================
// Asymmetric Key Pair (RSA-OAEP)
// ==========================================

export interface UserKeyPairExport {
  publicKeySpki: string; // Base64
  encryptedPrivateKey: string; // Base64
  privateKeyIv: string; // Base64
}

export async function generateUserKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
  );
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const spki = await window.crypto.subtle.exportKey("spki", publicKey);
  return bufferToBase64(spki);
}

export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(spkiBase64);
  return await window.crypto.subtle.importKey(
    "spki",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt", "wrapKey"],
  );
}

export async function encryptAndExportPrivateKey(
  privateKey: CryptoKey,
  uek: CryptoKey,
): Promise<{ encryptedPrivateKey: string; iv: string }> {
  const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  const iv = generateRandomIv(12);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    uek,
    pkcs8,
  );

  return {
    encryptedPrivateKey: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
  };
}

export async function decryptPrivateKey(
  encryptedPrivateKeyBase64: string,
  ivBase64: string,
  uek: CryptoKey,
): Promise<CryptoKey> {
  const ciphertext = base64ToBuffer(encryptedPrivateKeyBase64);
  const iv = base64ToBuffer(ivBase64);

  const pkcs8 = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    uek,
    ciphertext,
  );

  return await window.crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt", "unwrapKey"],
  );
}

// ==========================================
// Project Key Management (AES-256-GCM)
// ==========================================

export async function generateProjectMasterKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Wrap the Project Key for a specific user using their RSA-OAEP public key.
 */
export async function wrapProjectKey(
  projectKey: CryptoKey,
  userPublicKey: CryptoKey,
): Promise<string> {
  const rawKey = await window.crypto.subtle.exportKey("raw", projectKey);
  const wrapped = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    userPublicKey,
    rawKey,
  );
  return bufferToBase64(wrapped);
}

/**
 * Unwrap the Project Key using the user's RSA-OAEP private key.
 */
export async function unwrapProjectKey(
  encryptedProjectKeyBase64: string,
  userPrivateKey: CryptoKey,
): Promise<CryptoKey> {
  const ciphertext = base64ToBuffer(encryptedProjectKeyBase64);
  const rawKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    userPrivateKey,
    ciphertext,
  );

  return await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

// ==========================================
// Blind Index (Key Name Hashing)
// ==========================================

export async function computeBlindHash(
  keyName: string,
  salt = "workwise-e2ee-vault-v1",
): Promise<string> {
  const enc = new TextEncoder();
  const normalized = keyName.trim().toUpperCase();
  const data = enc.encode(`${salt}:${normalized}`);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return bufferToBase64(hashBuffer);
}

// ==========================================
// Secret Encryption & Decryption (Strings)
// ==========================================

export async function encryptSecretString(
  plaintext: string,
  projectKey: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = generateRandomIv(12);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    projectKey,
    enc.encode(plaintext),
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
  };
}

export async function decryptSecretString(
  ciphertextBase64: string,
  ivBase64: string,
  projectKey: CryptoKey,
): Promise<string> {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);
  const dec = new TextDecoder();

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    projectKey,
    ciphertext,
  );

  return dec.decode(decrypted);
}

// ==========================================
// Secret Files Encryption & Decryption (Blobs / Buffers)
// ==========================================

export async function encryptSecretFile(
  fileBuffer: ArrayBuffer,
  projectKey: CryptoKey,
): Promise<{ encryptedBlob: Blob; iv: string }> {
  const iv = generateRandomIv(12);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    projectKey,
    fileBuffer,
  );

  return {
    encryptedBlob: new Blob([ciphertext], { type: "application/octet-stream" }),
    iv: bufferToBase64(iv),
  };
}

export async function decryptSecretFile(
  encryptedBuffer: ArrayBuffer,
  ivBase64: string,
  projectKey: CryptoKey,
): Promise<ArrayBuffer> {
  const iv = base64ToBuffer(ivBase64);

  return await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    projectKey,
    encryptedBuffer,
  );
}
