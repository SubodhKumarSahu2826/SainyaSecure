// Military-grade cryptographic utilities simulation
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  data: string;
  signature: string;
  timestamp: number;
  senderId: string;
}

// Simulated RSA key generation
export function generateKeyPair(nodeId: string): KeyPair {
  const seed = Array.from(nodeId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const publicKey = `RSA-PUB-${seed.toString(16).toUpperCase().padStart(8, '0')}`;
  const privateKey = `RSA-PRIV-${(seed * 1337).toString(16).toUpperCase().padStart(8, '0')}`;
  
  return { publicKey, privateKey };
}

// Simulated AES encryption
export function encryptMessage(message: string, recipientPublicKey: string): string {
  const seed = Array.from(recipientPublicKey).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const encrypted = btoa(message).split('').map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ ((seed + i) % 256))
  ).join('');
  
  return btoa(encrypted);
}

// Simulated AES decryption
export function decryptMessage(encryptedMessage: string, privateKey: string): string {
  const seed = Array.from(privateKey).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const encrypted = atob(encryptedMessage);
  const decrypted = encrypted.split('').map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ ((seed + i) % 256))
  ).join('');
  
  return atob(decrypted);
}

// Digital signature simulation
export function signMessage(message: string, privateKey: string): string {
  const hash = simpleHash(message + privateKey);
  return `SIG-${hash.substring(0, 16).toUpperCase()}`;
}

// Signature verification
export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  // Simulate private key from public key for demo
  const mockPrivateKey = publicKey.replace('PUB', 'PRIV');
  const expectedSignature = signMessage(message, mockPrivateKey);
  return signature === expectedSignature;
}

// Simple hash function for demo
export function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Generate message hash for blockchain
export function generateMessageHash(content: string, timestamp: number, senderId: string): string {
  return simpleHash(`${content}${timestamp}${senderId}`);
}