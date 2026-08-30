# UPI Offline Mesh Network & Cryptographic Settlement System (MERN Stack)

> This application is a offline UPI mesh networking, hybrid cryptography (RSA-2048 + AES-256-GCM), Redis atomic idempotency, and transactional core bank settlement. Further in a production setting, real deployment requires integration with NPCI/Core Banking Systems (CBS), hardware security modules (HSM), physical BLE GATT drivers on Android/iOS, mobile device certificates, and regulatory compliance.

---

## 📌 Executive Summary

The **UPI Offline Mesh** system enables peer-to-peer offline digital payments in environments without cellular or internet connectivity (e.g., basements, subways, natural disasters). 

Payments are constructed offline on sender devices, encrypted using **hybrid RSA-2048 + AES-256-GCM**, and propagated hop-by-hop across nearby mobile phones via a **Virtual Bluetooth Low Energy (BLE) Mesh Network** with TTL decay. The moment any single intermediate phone ("Bridge Node") connects to 4G/5G/Wi-Fi, it securely uploads held payment packets to the central bank backend, where **atomic Redis idempotency (`SET NX EX`)** guarantees that duplicate packets delivered simultaneously across multiple bridge nodes settle **exactly once**.

---

## 🚀 Key Features

1. **Offline Payment Generation**: Senders sign payment instructions offline with unique nonces, timestamps, and PIN hashes.
2. **Hybrid Authenticated Cryptography**:
   - One-time 256-bit AES key generated per packet.
   - Payload encrypted with **AES-256-GCM** (authenticated encryption with 128-bit auth tag).
   - AES key encrypted with **RSA-2048-OAEP** (SHA-256 / MGF1 SHA-256).
   - Intermediary mesh phones only see opaque Base64 ciphertext and routing metadata (`packetId`, `ttl`).
3. **Virtual Mesh Simulator & TTL Gossip**: Deterministic simulation of multi-hop BLE packet propagation with TTL hop count decrementing.
4. **Atomic Redis Idempotency Gate**: Uses `SET key "claimed" EX 86400 NX` on the SHA-256 hash of the ciphertext. Protects against duplicate packet storms when 3+ bridges submit the same payment concurrently.
5. **Replay Attack & Tamper Protection**: Validates signed timestamp freshness window and verifies 16-byte AES-GCM authentication tags. Single-bit ciphertext tampering results in immediate rejection.
6. **MongoDB Transactional Settlement**: Double-entry ledger updates (debit sender, credit receiver, record transaction) executed inside MongoDB transactions.
7. **Real-time WebSockets Dashboard**: Built with React, Vite, Tailwind CSS, and Socket.IO for live topology rendering, packet inspection, and security demonstration controls.

---

## 🏗️ System Architecture

```
[ Sender: phone-alice ] (Offline)
         │
         │ (BLE Mesh Gossip / TTL - 1)
         ▼
[ Peer: phone-stranger1 ] (Offline)
         │
         │ (BLE Mesh Gossip / TTL - 1)
         ▼
[ Bridge: phone-bridge ] (4G / Wi-Fi Active)
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

## 💻 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, Socket.IO Client, Axios
- **Backend**: Node.js, Express.js, Socket.IO, Mongoose, ioredis, Node.js `crypto`
- **Databases & Caching**: MongoDB 7.0, Redis 7.0
- **Testing**: Jest, Supertest
- **DevOps**: Docker, Docker Compose, ESLint

---

## 📁 Monorepo Folder Structure

```
upi-offline-mesh/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Header, Stats, Visualizer, PaymentPanel, DemoControls, etc.
│   │   ├── App.jsx             # Main dashboard controller with WebSocket state
│   │   ├── index.css           # Tailwind base styles
│   │   └── main.jsx            # Entry point
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── server/                     # Express + Socket.IO Backend
│   ├── src/
│   │   ├── config/             # db.js (Mongoose), redis.js (ioredis)
│   │   ├── crypto/             # serverKeyHolder.js, hybridCryptoService.js
│   │   ├── models/             # Account.js, Transaction.js
│   │   ├── simulator/          # VirtualDevice.js, meshSimulatorService.js
│   │   ├── services/           # idempotencyService.js, settlementService.js, bridgeIngestionService.js
│   │   ├── controllers/        # apiController.js
│   │   ├── routes/             # apiRoutes.js
│   │   ├── sockets/            # socketHandler.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/                  # Jest integration & unit tests
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json                # Monorepo root scripts
└── README.md
```

---

## ⚡ Quick Start & Installation

### Option 1: Using Docker Compose (Recommended)

Run the complete monorepo stack (MongoDB, Redis, Backend, Frontend) with a single command:

```bash
docker compose up --build
```

Access the interfaces:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000/api`

---

### Option 2: Local Development (npm)

1. **Install All Monorepo Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start MongoDB & Redis locally** (or ensure local fallback is active).

3. **Launch Concurrent Dev Servers**:
   ```bash
   npm run dev
   ```

---

## 🧪 Automated Testing

Ported directly from the original JUnit test suite:

```bash
npm test
```

Tests included:
- `encryptDecryptRoundTrip`: Verifies RSA-2048 + AES-256-GCM payload encryption and decryption.
- `tamperedCiphertextIsRejected`: Ensures flipped bits in ciphertext trigger AES-GCM tag verification failure.
- `concurrentDuplicateDeliverySettlesExactlyOnce`: Simulates 3 bridge nodes uploading identical packet simultaneously. Verifies Redis `SET NX EX` allows exactly 1 SETTLED and 2 DUPLICATE_DROPPED.
- `replayedPacketIsRejected`: Verifies stale signedAt timestamp rejection.
- `gossipTTLDecreases` & `packetStopsWhenTTLIsZero`: Tests virtual mesh propagation limits.

---

## 🎮 Interactive Security Demos (Dashboard)

The React dashboard includes dedicated interactive buttons to demonstrate core engineering concepts live:

1. **🚀 Inject Payment Into Mesh**: Generates an encrypted payment packet on `phone-alice`.
2. **🔄 Run Gossip Round**: Triggers BLE mesh gossip; decrements TTL and copies packet to peer devices.
3. **⚡ Flush Bridge Node**: Simulates bridge node reaching 4G; POSTs held packets to `/api/bridge/ingest`.
4. **⚠️ Tamper Ciphertext**: Mutates 1 byte of Base64 ciphertext; verifies backend AES-GCM tag failure (`decryption_failed`).
5. **🔁 Replay Attack Demo**: Ingests identical packet twice; verifies idempotency layer drops second attempt as `DUPLICATE_DROPPED`.
6. **💥 Simulate 3 Concurrent Bridges (Killer Demo)**: Fires 3 simultaneous HTTP requests containing the same packet. Proves balance is debited **exactly once**.
7. **🧹 Reset Mesh**: Clears virtual device buffers and flushes Redis idempotency cache.
