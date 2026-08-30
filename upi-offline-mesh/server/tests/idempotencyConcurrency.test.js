const mongoose = require('mongoose');
const demoService = require('../src/services/demoService');
const bridgeIngestionService = require('../src/services/bridgeIngestionService');
const idempotencyService = require('../src/services/idempotencyService');
const Account = require('../src/models/Account');
const { disconnectRedis } = require('../src/config/redis');

describe('Idempotency & Concurrency Tests (Port of IdempotencyConcurrencyTest.java)', () => {
  beforeEach(async () => {
    await idempotencyService.clear();
    await demoService.seedAccounts();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  const getAccountBalance = async (vpa) => {
    if (mongoose.connection.readyState === 1) {
      const acc = await Account.findOne({ vpa });
      return acc ? acc.balance : 0;
    } else {
      const acc = demoService.getInMemoryAccounts().get(vpa);
      return acc ? acc.balance : 0;
    }
  };

  test('concurrentDuplicateDeliverySettlesExactlyOnce - 3 bridges posting identical packet simultaneously', async () => {
    const aliceBefore = await getAccountBalance('alice@demo');
    const bobBefore = await getAccountBalance('bob@demo');

    const packet = await demoService.createPacket('alice@demo', 'bob@demo', 100.0, '1234', 5);

    // Fire 3 simultaneous ingestion attempts
    const bridgeNodes = ['bridge-node-0', 'bridge-node-1', 'bridge-node-2'];
    const results = await Promise.all(
      bridgeNodes.map((node) => bridgeIngestionService.ingest(packet, node, 3))
    );

    const settledResults = results.filter((r) => r.outcome === 'SETTLED');
    const duplicateResults = results.filter((r) => r.outcome === 'DUPLICATE_DROPPED');

    expect(settledResults).toHaveLength(1);
    expect(duplicateResults).toHaveLength(2);

    const aliceAfter = await getAccountBalance('alice@demo');
    const bobAfter = await getAccountBalance('bob@demo');

    expect(aliceAfter).toBe(parseFloat((aliceBefore - 100.0).toFixed(2)));
    expect(bobAfter).toBe(parseFloat((bobBefore + 100.0).toFixed(2)));
  });

  test('duplicatePacketIsRejected - second attempt of same packet is dropped as duplicate', async () => {
    const packet = await demoService.createPacket('alice@demo', 'bob@demo', 75.0, '1234', 5);

    const res1 = await bridgeIngestionService.ingest(packet, 'bridge-a', 2);
    expect(res1.outcome).toBe('SETTLED');

    const res2 = await bridgeIngestionService.ingest(packet, 'bridge-b', 2);
    expect(res2.outcome).toBe('DUPLICATE_DROPPED');
  });

  test('insufficientBalance - payment exceeding balance records REJECTED status', async () => {
    const packet = await demoService.createPacket('dave@demo', 'alice@demo', 999999.0, '1234', 5);

    const res = await bridgeIngestionService.ingest(packet, 'bridge-c', 1);
    expect(res.outcome).toBe('REJECTED');
    expect(res.reason).toBe('insufficient_balance');
  });
});
