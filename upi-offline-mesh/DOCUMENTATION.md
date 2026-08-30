# 📘 Comprehensive Project Documentation: UPI Offline Mesh Network & Settlement System

> **Project Name**: `upi-offline-mesh`  
> **Original Reference**: `UPI_Without_Internet-main` (Spring Boot Java)  
> **Target Stack**: MERN (MongoDB, Express.js, React.js, Node.js) + Redis 7 + Socket.IO + Node.js Crypto  
> **Status**: 100% Migrated, Implemented, Tested (10/10 Jest Tests Passing), Containerized, and Verified Live  

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [How the System Works (Step-by-Step Workflow)](#2-how-the-system-works-step-by-step-workflow)
3. [Spring Boot to MERN Migration Mapping](#3-spring-boot-to-mern-migration-mapping)
4. [Cryptographic Architecture & Security Guarantees](#4-cryptographic-architecture--security-guarantees)
5. [Interactive React Dashboard & UI Guide](#5-interactive-react-dashboard--ui-guide)
6. [Automated Testing & Build Results](#6-automated-testing--build-results)
7. [Career, Resume, & Strategic Value](#7-career-resume--strategic-value)
8. [Real-World Production Viability & Challenges](#8-real-world-production-viability--challenges)
9. [Web PWA & Web Bluetooth Roadmap](#9-web-pwa--web-bluetooth-roadmap)

---

## 1. Executive Summary & Problem Statement

### 🔴 The Real-World Problem
Traditional Unified Payments Interface (UPI) systems in India require active cellular data (4G/5G) or Wi-Fi connectivity on both sender and receiver devices. When users are in **basement parking lots, underground metro stations, crowded concert venues, remote hilly areas, or natural disaster zones**, cellular networks fail ("*Payment Failed: Network Connection Error*").

### 🟢 The Solution
The **UPI Offline Mesh** system enables peer-to-peer offline payment intent creation and propagation. Payments are signed and encrypted offline on sender devices using **hybrid RSA-2048 + AES-256-GCM** cryptography and transmitted hop-by-hop across nearby mobile phones via a **Virtual Bluetooth Low Energy (BLE) Mesh Network** with TTL hop count decay. The moment any intermediate device ("Bridge Node") reaches internet connectivity, it POSTs the held packets to the central bank backend, where **atomic Redis idempotency (`SET NX EX`)** and **MongoDB ACID transactions** settle the balances exactly once.

---

## 2. How the System Works (Step-by-Step Workflow)

```
[ Alice ka Phone ]  ──(BLE Hop / TTL-1)──>  [ Peer Node 1 ]  ──(BLE Hop / TTL-1)──>  [ Bridge Phone ]  ──(4G/Wi-Fi)──>  [ Central Bank Server ]
 (Basement - 0 Net)                           (No Internet)                            (Market - Net Active)               (Decryption & Settlement)
```

### Step 1: Offline Payment Packet Creation
1. Alice (in basement, 0 internet) creates a payment intent of **₹500** to Bob.
2. Alice's device generates a random 256-bit AES key and encrypts the payload (`senderVpa`, `receiverVpa`, `amount`, `pinHash`, `nonce`, `signedAt`) using **AES-256-GCM**.
3. The AES key is encrypted using the Bank's **RSA-2048 Public Key** with **OAEP-SHA256** padding.
4. The encrypted envelope (`MeshPacket`) is packaged with outer routing metadata (`packetId`, `ttl=5`). Intermediary phones cannot view sensitive payment details.

### Step 2: Mesh Propagation (BLE Gossip & TTL Decay)
1. Alice's device broadcasts the packet to nearby peer devices via Bluetooth Low Energy (BLE).
2. Each receiving device checks if it already holds the packet. If not, it stores a copy and decrements TTL by 1 (`5 ➔ 4 ➔ 3...`).
3. Packets stop forwarding when `TTL = 0`.

### Step 3: Bridge Ingestion
1. As soon as any device with active 4G/Wi-Fi (`phone-bridge`) receives the packet, it POSTs the payload to `/api/bridge/ingest`.

### Step 4: Server Security & Settlement Pipeline
1. **Ciphertext Hashing**: Calculates SHA-256 hex digest of the Base64 ciphertext.
2. **Atomic Idempotency Claim**: Executes `SET idempotency:<hash> "claimed" EX 86400 NX` in Redis. If multiple bridges submit the same packet simultaneously, exactly one succeeds (`SETTLED`) and others drop (`DUPLICATE_DROPPED`).
3. **Hybrid Decryption**: Decrypts AES key using Bank's RSA Private Key and verifies the 16-byte AES-GCM authentication tag (detects tampering).
4. **Freshness Check**: Rejects packets signed older than `PACKET_MAX_AGE_SECONDS` (replay attack protection).
5. **Ledger Settlement**: Debits Alice ₹500, credits Bob ₹500, and records an immutable transaction entry in MongoDB.

---

## 3. Spring Boot to MERN Migration Mapping

| Spring Boot Java Component | MERN Stack Equivalent | Responsibility |
|---|---|---|
| `Account.java` (JPA Entity) | `server/src/models/Account.js` | Bank account balance & optimistic lock version |
| `Transaction.java` (JPA Entity) | `server/src/models/Transaction.js` | Immutable ledger transaction record |
| `MeshPacket.java` | Object Schema / TypeScript interface | Over-the-air packet envelope |
| `PaymentInstruction.java` | Object Schema / TypeScript interface | Decrypted sensitive payment payload |
| `HybridCryptoService.java` | `server/src/crypto/hybridCryptoService.js` | RSA-2048-OAEP + AES-256-GCM encrypt/decrypt |
| `ServerKeyHolder.java` | `server/src/crypto/serverKeyHolder.js` | RSA keypair generation & SPKI Base64 export |
| `VirtualDevice.java` | `server/src/simulator/VirtualDevice.js` | Simulated mobile node class |
| `MeshSimulatorService.java` | `server/src/simulator/meshSimulatorService.js` | Mesh gossip round & bridge packet harvesting |
| `IdempotencyService.java` | `server/src/services/idempotencyService.js` | Redis `SET NX EX` atomic claiming + fallback |
| `SettlementService.java` | `server/src/services/settlementService.js` | Dual MongoDB Session / In-Memory settlement engine |
| `BridgeIngestionService.java` | `server/src/services/bridgeIngestionService.js` | 5-stage ingestion pipeline orchestrator |
| `DemoService.java` | `server/src/services/demoService.js` | Account seeding & offline packet generation |
| `ApiController.java` | `server/src/controllers/apiController.js` | REST controllers for mesh, key, & security demos |
| Dashboard Thymeleaf UI | `client/` (React + Vite + Tailwind CSS) | Interactive cybersecurity & telemetry dashboard |
| `IdempotencyConcurrencyTest.java` | `server/tests/idempotencyConcurrency.test.js` | Jest parallel 3-bridge upload concurrency tests |

---

## 4. Cryptographic Architecture & Security Guarantees

### Binary Packing Format
```
[ 256 bytes RSA-OAEP Encrypted AES Key ] + [ 12 bytes AES-GCM IV ] + [ AES-256-GCM Ciphertext + 16-byte Auth Tag ]
```

### Security Matrix
* **Confidentiality**: Payload encrypted with 256-bit AES key. Intermediaries only see opaque Base64 bytes.
* **Integrity / Tamper Detection**: AES-GCM 128-bit authentication tag. 1-bit ciphertext modification causes `decryption_failed` rejection.
* **Replay Protection**: Nonce (UUID) guarantees unique ciphertext hashes; `signedAt` timestamp enforces freshness window.
* **Idempotency Guarantee**: Ciphertext SHA-256 hash claimed atomically via Redis `SET NX EX`.

---

## 5. Interactive React Dashboard & UI Guide

Access URL: **`http://localhost:5173`**

### Components & Demo Operations

1. **Header & Health Indicators**: Live indicators for WebSocket (`ws://localhost:5000`), MongoDB, Redis, and Mesh status.
2. **Top Metrics Cards**: Real-time stats for Virtual Devices (5), Packets in Mesh, Gossip Transfers, Idempotency Cache Keys, Settled Transactions, and Rejected Packets.
3. **BLE Mesh Visualizer**: Interactive network graph displaying `phone-alice` (Offline) ➔ `phone-strangers` ➔ `phone-bridge` (4G Active) ➔ `Bank Server`.
4. **Offline Payment Injection Panel**: Input form for Sender VPA, Receiver VPA, Amount, PIN, TTL, and starting device.
5. **Security Control Deck**:
   - 🚀 **Inject Payment**: Generates RSA+AES encrypted packet on `phone-alice`.
   - 🔄 **Run Gossip Round**: Propagates BLE packets to peer nodes and decrements TTL.
   - ⚡ **Flush Bridge Node**: POSTs held packets to `/api/bridge/ingest`.
   - ⚠️ **Tamper Ciphertext**: Mutates Base64 byte to verify AES-GCM tag mismatch.
   - 🔁 **Replay Attack Demo**: Submits identical packet twice; verifies idempotency drop.
   - 💥 **Simulate 3 Concurrent Bridges (Killer Demo)**: Fires 3 simultaneous HTTP POSTs; verifies **exactly 1 SETTLED & 2 DUPLICATE_DROPPED**.
   - 🧹 **Reset Mesh**: Clears node buffers and flushes Redis cache.
6. **Opaque Packet Inspector**: View raw Base64 RSA+AES ciphertext and SHA-256 hash without exposing plain JSON.
7. **Immutable Transaction Ledger & Bank Cards**: Live double-entry table with `SETTLED`/`REJECTED` badges and real-time bank balances.
8. **Real-time Event Stream**: Color-coded WebSocket audit log.

---

## 6. Automated Testing & Build Results

### Jest Integration Suite (`npm test`)
```
PASS tests/idempotencyConcurrency.test.js
PASS tests/replay.test.js
PASS tests/crypto.test.js
PASS tests/mesh.test.js

Test Suites: 4 passed, 4 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        1.573 s
```

### Vite Production Client Build (`npm run build:client`)
```
vite v5.4.21 building for production...
transforming...
✓ 1596 modules transformed.
dist/index.html                   0.93 kB
dist/assets/index-DYZDGlaO.css   22.63 kB
dist/assets/index-vmpuai9D.js   276.29 kB
✓ built in 42.85s
```

---

## 7. Career, Resume, & Strategic Value

### Resume Positioning
This is an **S-Tier / Top 1% High-Impact Project** for **Full-Stack, Backend, FinTech, and Systems Design Engineer** roles.

### Key Resume Bullet Points
```markdown
**UPI Offline Mesh — Cryptographic Settlement & BLE Mesh Simulator** | MERN, Redis, Docker, Cryptography
- Designed an offline UPI payment settlement engine using RSA-2048-OAEP and AES-256-GCM hybrid encryption for secure peer-to-peer payment instruction creation without cellular connectivity.
- Built a multi-hop Bluetooth Low Energy (BLE) virtual mesh simulator with TTL hop decay and bridge node harvesting logic for packet propagation.
- Engineered a zero-race-condition idempotency layer using atomic Redis `SET NX EX` keys on SHA-256 ciphertext digests, handling concurrent multi-bridge uploads with exactly-once settlement guarantees.
- Developed an ACID-compliant MongoDB transactional settlement engine for real-time ledger debit/credit updates and a real-time Socket.IO cybersecurity telemetry dashboard.
- Containerized the entire monorepo with Docker Compose and achieved 100% pass rate across Jest integration test suites.
```

---

## 8. Real-World Production Viability & Challenges

### Is it viable for real production?
**YES**, with the following production additions:

1. **Android/iOS Native Layer**: Kotlin/Swift BLE GATT scanning (`BluetoothLeScanner` & `CoreBluetooth`).
2. **Hardware Security Element**: Storing keys in Android Keystore / iOS Secure Enclave / StrongBox.
3. **NPCI / Bank CBS Integration**: Connecting Express ingestion API to NPCI UPI Switch / Bank APIs.
4. **Offline Wallet Pool**: Pre-funding offline balance reserves (NPCI UPI Lite model) to eliminate double-spending risks.

---

## 9. Web PWA & Web Bluetooth Roadmap

A **Web Browser (PWA)** implementation can enable offline payments without installing a native APK:
- **Progressive Web App (PWA)**: Web app opens in browser even during total offline / Airplane mode.
- **Web Bluetooth API (`navigator.bluetooth`)**: Scans and exchanges data with nearby Bluetooth devices from Chrome/Edge.
- **Web Crypto API (`window.crypto.subtle`)**: Executes RSA+AES encryption inside browser engine.
- **Service Worker Background Sync**: Automatically uploads packets when connectivity returns.
