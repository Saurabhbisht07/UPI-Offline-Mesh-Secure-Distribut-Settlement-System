const crypto = require('crypto');
const serverKeyHolder = require('./serverKeyHolder');

const RSA_ENCRYPTED_KEY_BYTES = 256; // 2048-bit RSA produces 256 bytes
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

class HybridCryptoService {
  /**
   * Encrypt a payment instruction object with the server's public key.
   * Wire format: [ 256 bytes RSA-encrypted AES key ][ 12 bytes GCM IV ][ ciphertext + 16-byte tag ]
   */
  encrypt(paymentInstruction, publicKeyPem = null) {
    const pubKey = publicKeyPem || serverKeyHolder.getPublicKeyPem();
    const plaintext = Buffer.from(JSON.stringify(paymentInstruction), 'utf8');

    // 1. Generate one-time 256-bit AES key
    const aesKey = crypto.randomBytes(32);

    // 2. AES-GCM encrypt payload
    const iv = crypto.randomBytes(GCM_IV_BYTES);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    let aesCiphertext = cipher.update(plaintext);
    aesCiphertext = Buffer.concat([aesCiphertext, cipher.final()]);
    const tag = cipher.getAuthTag();

    // 3. RSA-OAEP encrypt AES key
    const encryptedAesKey = crypto.publicEncrypt(
      {
        key: pubKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
        mgf1Hash: 'sha256'
      },
      aesKey
    );

    // 4. Pack: [encrypted AES key][IV][AES ciphertext + tag]
    const packed = Buffer.concat([encryptedAesKey, iv, aesCiphertext, tag]);
    return packed.toString('base64');
  }

  /**
   * Decrypt ciphertext using server's private key.
   * Throws an Error if tampered, corrupted, or invalid.
   */
  decrypt(base64Ciphertext) {
    const all = Buffer.from(base64Ciphertext, 'base64');

    if (all.length < RSA_ENCRYPTED_KEY_BYTES + GCM_IV_BYTES + GCM_TAG_BYTES) {
      throw new Error('Ciphertext too short');
    }

    const encryptedAesKey = all.subarray(0, RSA_ENCRYPTED_KEY_BYTES);
    const iv = all.subarray(RSA_ENCRYPTED_KEY_BYTES, RSA_ENCRYPTED_KEY_BYTES + GCM_IV_BYTES);
    const aesCiphertextAndTag = all.subarray(RSA_ENCRYPTED_KEY_BYTES + GCM_IV_BYTES);

    const aesCiphertext = aesCiphertextAndTag.subarray(0, aesCiphertextAndTag.length - GCM_TAG_BYTES);
    const tag = aesCiphertextAndTag.subarray(aesCiphertextAndTag.length - GCM_TAG_BYTES);

    // 1. RSA decrypt AES key
    const aesKey = crypto.privateDecrypt(
      {
        key: serverKeyHolder.getPrivateKeyPem(),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
        mgf1Hash: 'sha256'
      },
      encryptedAesKey
    );

    // 2. AES-GCM decrypt & verify tag
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(tag);

    let plaintext = decipher.update(aesCiphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);

    return JSON.parse(plaintext.toString('utf8'));
  }

  /**
   * Calculate SHA-256 hex string of the Base64 ciphertext.
   * Serves as the global Idempotency Key.
   */
  hashCiphertext(base64Ciphertext) {
    return crypto.createHash('sha256').update(base64Ciphertext, 'utf8').digest('hex');
  }
}

module.exports = new HybridCryptoService();
