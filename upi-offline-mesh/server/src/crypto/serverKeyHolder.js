const crypto = require('crypto');

class ServerKeyHolder {
  constructor() {
    this.publicKeyPem = null;
    this.privateKeyPem = null;
    this.publicKeyDerBase64 = null;
    this.init();
  }

  init() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    this.publicKeyPem = publicKey;
    this.privateKeyPem = privateKey;

    const pubKeyObject = crypto.createPublicKey(publicKey);
    const pubKeyDer = pubKeyObject.export({ type: 'spki', format: 'der' });
    this.publicKeyDerBase64 = pubKeyDer.toString('base64');

    console.log(
      `[ServerKeyHolder] Server RSA keypair generated (2048-bit). Public key fingerprint: ${this.publicKeyDerBase64.substring(
        0,
        32
      )}...`
    );
  }

  getPublicKeyPem() {
    return this.publicKeyPem;
  }

  getPrivateKeyPem() {
    return this.privateKeyPem;
  }

  getPublicKeyBase64() {
    return this.publicKeyDerBase64;
  }
}

const serverKeyHolderInstance = new ServerKeyHolder();
module.exports = serverKeyHolderInstance;
