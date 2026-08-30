const crypto = require('crypto');
const mongoose = require('mongoose');
const Account = require('../models/Account');
const hybridCryptoService = require('../crypto/hybridCryptoService');
const serverKeyHolder = require('../crypto/serverKeyHolder');

// In-memory accounts storage fallback for testing / offline dev
const inMemoryAccounts = new Map();

class DemoService {
  initInMemoryAccounts() {
    inMemoryAccounts.clear();
    inMemoryAccounts.set('alice@demo', { vpa: 'alice@demo', holderName: 'Alice', balance: 5000.0, version: 0 });
    inMemoryAccounts.set('bob@demo', { vpa: 'bob@demo', holderName: 'Bob', balance: 1000.0, version: 0 });
    inMemoryAccounts.set('carol@demo', { vpa: 'carol@demo', holderName: 'Carol', balance: 2500.0, version: 0 });
    inMemoryAccounts.set('dave@demo', { vpa: 'dave@demo', holderName: 'Dave', balance: 500.0, version: 0 });
  }

  getInMemoryAccounts() {
    if (inMemoryAccounts.size === 0) {
      this.initInMemoryAccounts();
    }
    return inMemoryAccounts;
  }

  async seedAccounts() {
    if (mongoose.connection.readyState === 1) {
      try {
        const count = await Account.countDocuments();
        if (count === 0) {
          await Account.insertMany([
            { vpa: 'alice@demo', holderName: 'Alice', balance: 5000.0, version: 0 },
            { vpa: 'bob@demo', holderName: 'Bob', balance: 1000.0, version: 0 },
            { vpa: 'carol@demo', holderName: 'Carol', balance: 2500.0, version: 0 },
            { vpa: 'dave@demo', holderName: 'Dave', balance: 500.0, version: 0 }
          ]);
          console.log('[DemoService] Seeded 4 initial demo accounts in MongoDB.');
        }
      } catch (err) {
        console.warn('[DemoService] MongoDB seed warning:', err.message);
      }
    } else {
      this.initInMemoryAccounts();
      console.log('[DemoService] Seeded 4 in-memory demo accounts (Standalone/Test Mode).');
    }
  }

  async createPacket(senderVpa, receiverVpa, amount, pin = '1234', ttl = 5) {
    const pinHash = this.sha256Hex(pin);
    const nonce = crypto.randomUUID();
    const signedAt = Date.now();

    const paymentInstruction = {
      senderVpa,
      receiverVpa,
      amount: parseFloat(amount),
      pinHash,
      nonce,
      signedAt
    };

    const ciphertext = hybridCryptoService.encrypt(paymentInstruction, serverKeyHolder.getPublicKeyPem());

    const meshPacket = {
      packetId: crypto.randomUUID(),
      ttl: parseInt(ttl, 10),
      createdAt: Date.now(),
      ciphertext
    };

    return meshPacket;
  }

  sha256Hex(input) {
    return crypto.createHash('sha256').update(input || '', 'utf8').digest('hex');
  }
}

module.exports = new DemoService();
