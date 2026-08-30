const meshSimulatorService = require('../src/simulator/meshSimulatorService');
const { disconnectRedis } = require('../src/config/redis');

describe('Mesh Simulator & TTL Tests', () => {
  beforeEach(() => {
    meshSimulatorService.resetMesh();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  test('gossipTTLDecreases - gossip round should copy packets to neighbors with decremented TTL', () => {
    const packet = {
      packetId: 'pkt-ttl-test-1',
      ttl: 3,
      createdAt: Date.now(),
      ciphertext: 'test-ciphertext-data-string'
    };

    meshSimulatorService.inject('phone-alice', packet);

    const aliceDevice = meshSimulatorService.getDevice('phone-alice');
    expect(aliceDevice.packetCount()).toBe(1);

    const result = meshSimulatorService.gossipOnce();
    expect(result.transfers).toBeGreaterThan(0);

    const strangerDevice = meshSimulatorService.getDevice('phone-stranger1');
    expect(strangerDevice.packetCount()).toBe(1);

    const heldPackets = strangerDevice.getHeldPackets();
    expect(heldPackets[0].ttl).toBe(2);
  });

  test('packetStopsWhenTTLIsZero - packets with TTL=0 should not be forwarded in gossip', () => {
    const packetZero = {
      packetId: 'pkt-zero-ttl',
      ttl: 0,
      createdAt: Date.now(),
      ciphertext: 'test-zero-ttl-ciphertext'
    };

    meshSimulatorService.inject('phone-alice', packetZero);

    const result = meshSimulatorService.gossipOnce();
    expect(result.transfers).toBe(0);

    const strangerDevice = meshSimulatorService.getDevice('phone-stranger1');
    expect(strangerDevice.packetCount()).toBe(0);
  });
});
