const cryptoService = require('../crypto/hybridCryptoService');
const idempotencyService = require('./idempotencyService');
const settlementService = require('./settlementService');

class BridgeIngestionService {
  constructor() {
    this.maxAgeSeconds = parseInt(process.env.PACKET_MAX_AGE_SECONDS || '86400', 10);
  }

  async ingest(packet, bridgeNodeId = 'unknown', hopCount = 0) {
    try {
      if (!packet || !packet.ciphertext) {
        return {
          outcome: 'INVALID',
          packetHash: '?',
          reason: 'missing_ciphertext',
          transactionId: null
        };
      }

      // 1. Hash the ciphertext (Idempotency key)
      const packetHash = cryptoService.hashCiphertext(packet.ciphertext);

      // 2. Atomic Idempotency Claim Gate
      const isClaimed = await idempotencyService.claim(packetHash);
      if (!isClaimed) {
        console.log(
          `[Ingestion] DUPLICATE packet ${packetHash.substring(0, 12)}... from bridge ${bridgeNodeId} — dropped`
        );
        return {
          outcome: 'DUPLICATE_DROPPED',
          packetHash,
          reason: 'duplicate_claimed',
          transactionId: null
        };
      }

      // 3. Hybrid RSA+AES Decryption & Authenticated Tag Verification
      let instruction;
      try {
        instruction = cryptoService.decrypt(packet.ciphertext);
      } catch (err) {
        console.warn(
          `[Ingestion] Decryption failed for packet ${packetHash.substring(0, 12)}...: ${err.message}`
        );
        return {
          outcome: 'INVALID',
          packetHash,
          reason: 'decryption_failed',
          transactionId: null
        };
      }

      // 4. Freshness Check (Replay Attack Protection)
      const now = Date.now();
      const ageSeconds = (now - instruction.signedAt) / 1000;

      if (ageSeconds > this.maxAgeSeconds) {
        console.warn(
          `[Ingestion] Packet ${packetHash.substring(0, 12)}... too old (${Math.round(ageSeconds)}s), rejected`
        );
        return {
          outcome: 'INVALID',
          packetHash,
          reason: 'stale_packet',
          transactionId: null
        };
      }
      if (ageSeconds < -300) {
        return {
          outcome: 'INVALID',
          packetHash,
          reason: 'future_dated',
          transactionId: null
        };
      }

      // 5. Settlement Execution (Debit / Credit Ledger Update)
      const tx = await settlementService.settle(instruction, packetHash, bridgeNodeId, hopCount);

      return {
        outcome: tx.status === 'REJECTED' ? 'REJECTED' : 'SETTLED',
        packetHash,
        reason: tx.status === 'REJECTED' ? 'insufficient_balance' : null,
        transactionId: tx._id ? tx._id.toString() : null,
        transaction: tx
      };
    } catch (err) {
      console.error(`[Ingestion] Ingestion error:`, err);
      return {
        outcome: 'INVALID',
        packetHash: '?',
        reason: `internal_error: ${err.message}`,
        transactionId: null
      };
    }
  }
}

module.exports = new BridgeIngestionService();
