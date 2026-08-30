const hybridCryptoService = require('../src/crypto/hybridCryptoService');
const bridgeIngestionService = require('../src/services/bridgeIngestionService');
const idempotencyService = require('../src/services/idempotencyService');
const demoService = require('../src/services/demoService');
const { disconnectRedis } = require('../src/config/redis');

describe('Replay Attack Protection Tests', () => {
  beforeEach(async () => {
    await idempotencyService.clear();
    await demoService.seedAccounts();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  test('replayedPacketIsRejected - stale signedAt timestamp should be rejected as invalid stale_packet', async () => {
    // Payment instruction signed 100 days ago
    const staleInstruction = {
      senderVpa: 'alice@demo',
      receiverVpa: 'bob@demo',
      amount: 100.0,
      pinHash: '1234',
      nonce: 'nonce-stale-1',
      signedAt: Date.now() - 100 * 24 * 60 * 60 * 1000
    };

    const ciphertext = hybridCryptoService.encrypt(staleInstruction);

    const packet = {
      packetId: 'packet-stale-123',
      ttl: 5,
      createdAt: Date.now(),
      ciphertext
    };

    const res = await bridgeIngestionService.ingest(packet, 'bridge-stale-test', 1);

    expect(res.outcome).toBe('INVALID');
    expect(res.reason).toBe('stale_packet');
  });

  test('replayedPacketIsRejected - identical valid packet submitted twice should be caught by idempotency', async () => {
    const packet = await demoService.createPacket('alice@demo', 'bob@demo', 20.0, '1234', 5);

    const res1 = await bridgeIngestionService.ingest(packet, 'bridge-node-x', 1);
    expect(res1.outcome).toBe('SETTLED');

    const res2 = await bridgeIngestionService.ingest(packet, 'bridge-node-y', 1);
    expect(res2.outcome).toBe('DUPLICATE_DROPPED');
  });
});
