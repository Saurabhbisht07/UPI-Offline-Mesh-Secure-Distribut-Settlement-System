# UPI Offline Mesh Network & Cryptographic Settlement System

A complete MERN stack (Node.js, Express, React, Tailwind CSS) system that demonstrates **offline UPI payments routed through a Virtual Bluetooth Low Energy (BLE) Mesh Network**. 

You are in a basement with zero cellular connectivity. You send your friend ₹500. Your device encrypts the payment using **hybrid RSA-2048 + AES-256-GCM**, broadcasts it to nearby devices via a BLE mesh network (with TTL decay), and the packet hops device-to-device until *some* phone walks outside, receives internet connectivity (4G/5G/Wi-Fi), and securely uploads it to the central backend. The backend decrypts, deduplicates via **atomic Redis idempotency**, and settles the ledger.

---

## 📑 Table of Contents

1. [What this System Proves](#what-this-system-proves)
2. [Architecture](#architecture)
3. [The Three Hard Problems & Solutions](#the-three-hard-problems--solutions)
4. [Quick Start & Running Locally](#quick-start--running-locally)
5. [Interactive Security Demos](#interactive-security-demos)
6. [API Reference](#api-reference)
7. [Automated Testing](#automated-testing)
8. [Real-World Viability & Production Considerations](#real-world-viability--production-considerations)

---

## What this System Proves

The system demonstrates three core cryptographic and distributed system guarantees end-to-end:

1. **Untrusted Mesh Routing**: A payment packet travels from sender to backend through untrusted intermediary devices without any intermediary being able to read sensitive details or alter amounts (Hybrid RSA-2048 + AES-256-GCM encryption).
2. **Exactly-Once Settlement**: Even if the same payment packet reaches the backend simultaneously through multiple bridge nodes, it settles **exactly once** (Idempotency via atomic `SET NX EX` in Redis on the ciphertext SHA-256 hash).
3. **Cryptographic Integrity & Replay Defense**: Tampered or replayed packets are immediately detected and rejected before reaching the ledger (AES-GCM 128-bit authentication tag verification + signed timestamp freshness window).

---

## Architecture

```
[ Sender: phone-alice ] (Offline - Basement)
         │
         │ (BLE Mesh Gossip / TTL - 1)
         ▼
[ Peer: phone-stranger1 ] (Offline - Basement)
         │
         │ (BLE Mesh Gossip / TTL - 1)
         ▼
[ Bridge: phone-bridge ] (4G / Wi-Fi Active - Outside)
         │
         │ POST /api/bridge/ingest
         ▼
┌──────────────────────────────────────────────────────────┐
│ Central Settlement Server (Node.js / Express)             │
│                                                          │
│ 1. Hash Ciphertext -> SHA-256 Hex                        │
│ 2. Claim Idempotency -> Redis SET NX EX (Atomic Gate)    │
│ 3. Decrypt RSA-OAEP Key + AES-256-GCM Tag Verification   │
│ 4. Freshness Window Check (signedAt vs MaxAge)           │
│ 5. Execute DB Transaction -> MongoDB Account Debit/Credit│
└──────────────────────────────────────────────────────────┘
```

---

## The Three Hard Problems & Solutions

### 1. Untrusted Intermediaries
* **Challenge**: A stranger's device carries your transaction. How do you prevent them from reading or modifying the payment?
* **Solution**: Hybrid Encryption (**RSA-2048-OAEP + AES-256-GCM**).
  - Alice's device generates a fresh 256-bit AES key for the packet.
  - Payload is encrypted with AES-256-GCM (authenticated encryption with 16-byte auth tag).
  - AES key is encrypted with the Bank Server's RSA-2048 public key.
  - Intermediaries only see opaque Base64 ciphertext and outer routing metadata (`packetId`, `ttl`). Any bit modification breaks the AES-GCM tag on decryption, causing immediate rejection.

### 2. Duplicate Packet Storms
* **Challenge**: 3 bridge nodes receive the same packet in the mesh and upload it simultaneously when reaching internet connectivity.
* **Solution**: Atomic Redis Idempotency Gate (`SET key "claimed" EX 86400 NX`).
  - Server computes `SHA-256(ciphertext)`.
  - Atomically claims the hash key in Redis before spending CPU on RSA decryption or touching the database.
  - Exactly 1 bridge request succeeds (`SETTLED`); concurrent requests return `DUPLICATE_DROPPED`.

### 3. Replay Attacks
* **Challenge**: An attacker captures a valid ciphertext and replays it later.
* **Solution**: Nonce + Timestamp Freshness Window.
  - Encrypted payload contains a unique UUID nonce (making every unique payment yield a distinct ciphertext) and a `signedAt` timestamp.
  - Server rejects packets signed outside the freshness window (`PACKET_MAX_AGE_SECONDS`).

---

## Quick Start & Running Locally

### Prerequisites
- **Node.js 18+** and **npm** installed.
- (Optional) Docker Compose for running MongoDB + Redis easily.

### Option 1: Development Servers (npm)

1. Navigate to the `upi-offline-mesh` directory:
   ```bash
   cd upi-offline-mesh
   ```

2. Install dependencies for root, client, and server:
   ```bash
   npm run install:all
   ```

3. Start backend & frontend concurrently:
   ```bash
   npm run dev
   ```

4. Open the Web Dashboard:
   - **Frontend UI**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

### Option 2: Docker Compose

From `upi-offline-mesh`:
```bash
docker compose up --build
```

---

## Interactive Security Demos

The React dashboard provides interactive controls to test security guarantees live:

1. **🚀 Inject Payment Into Mesh**: Generates an encrypted payment packet on `phone-alice`.
2. **🔄 Run Gossip Round**: Triggers BLE mesh gossip; decrements TTL and propagates packet to peer devices.
3. **⚡ Flush Bridge Node**: Simulates bridge node getting 4G connectivity; POSTs packets to `/api/bridge/ingest`.
4. **⚠️ Tamper Ciphertext**: Mutates 1 byte of Base64 ciphertext; verifies backend AES-GCM tag verification failure.
5. **🔁 Replay Attack Demo**: Ingests identical packet twice; verifies idempotency layer drops second attempt as `DUPLICATE_DROPPED`.
6. **💥 Simulate 3 Concurrent Bridges**: Fires 3 simultaneous HTTP requests containing the same packet. Proves balance is debited **exactly once**.
7. **🧹 Reset Mesh**: Clears virtual device buffers and flushes Redis idempotency cache.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/server-key` | Fetch server's RSA public key (base64) |
| GET | `/api/accounts` | Retrieve all account balances |
| GET | `/api/transactions` | Fetch settled ledger transactions |
| GET | `/api/mesh/state` | Current state of virtual mesh devices |
| POST | `/api/demo/send` | Simulate offline payment injection |
| POST | `/api/mesh/gossip` | Execute one round of BLE mesh gossip |
| POST | `/api/mesh/flush` | Upload packets held on bridge devices |
| POST | `/api/bridge/ingest` | Central bridge packet ingestion pipeline |
| POST | `/api/demo/tamper` | Trigger ciphertext bit-flip security test |
| POST | `/api/demo/replay` | Trigger replay attack test |
| POST | `/api/demo/concurrent-duplicate` | Trigger 3-bridge concurrent upload test |

---

## Automated Testing

Run the full integration test suite (Jest & Supertest):

```bash
cd upi-offline-mesh
npm test
```

Tests cover:
- `encryptDecryptRoundTrip`: RSA-2048 + AES-256-GCM symmetric round-trip.
- `tamperedCiphertextIsRejected`: AES-GCM authentication tag mismatch validation.
- `concurrentDuplicateDeliverySettlesExactlyOnce`: Parallel bridge upload idempotency validation.
- `replayedPacketIsRejected`: Freshness window timestamp validation.

---

## License

MIT License. Open for educational and research purposes.
