const hybridCryptoService = require('../src/crypto/hybridCryptoService');
const serverKeyHolder = require('../src/crypto/serverKeyHolder');
const { disconnectRedis } = require('../src/config/redis');

describe('Hybrid Cryptography Service Tests', () => {
  afterAll(async () => {
    await disconnectRedis();
  });

  test('encryptDecryptRoundTrip - should encrypt and decrypt payment instruction correctly', () => {
    const originalInstruction = {
      senderVpa: 'alice@demo',
      receiverVpa: 'bob@demo',
      amount: 123.45,
      pinHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      nonce: 'test-nonce-12345',
      signedAt: Date.now()
    };

    const ciphertext = hybridCryptoService.encrypt(
      originalInstruction,
      serverKeyHolder.getPublicKeyPem()
    );

    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(300);

    const decrypted = hybridCryptoService.decrypt(ciphertext);

    expect(decrypted.senderVpa).toBe(originalInstruction.senderVpa);
    expect(decrypted.receiverVpa).toBe(originalInstruction.receiverVpa);
    expect(decrypted.amount).toBe(originalInstruction.amount);
    expect(decrypted.nonce).toBe(originalInstruction.nonce);
    expect(decrypted.signedAt).toBe(originalInstruction.signedAt);
  });

  test('tamperedCiphertextIsRejected - modified ciphertext should fail AES-GCM tag authentication', () => {
    const originalInstruction = {
      senderVpa: 'alice@demo',
      receiverVpa: 'bob@demo',
      amount: 50.0,
      pinHash: '1234',
      nonce: 'nonce-tamper-1',
      signedAt: Date.now()
    };

    const ciphertext = hybridCryptoService.encrypt(originalInstruction);

    // Tamper one byte
    const chars = ciphertext.split('');
    const mid = Math.floor(chars.length / 2);
    chars[mid] = chars[mid] === 'A' ? 'B' : 'A';
    const tamperedCiphertext = chars.join('');

    expect(() => {
      hybridCryptoService.decrypt(tamperedCiphertext);
    }).toThrow();
  });

  test('hashCiphertext - should return consistent 64-char SHA-256 hex digest', () => {
    const text = 'test-base64-ciphertext-data';
    const hash1 = hybridCryptoService.hashCiphertext(text);
    const hash2 = hybridCryptoService.hashCiphertext(text);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });
});
