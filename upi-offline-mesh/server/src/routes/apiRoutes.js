const express = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

// Key endpoint
router.get('/server-key', (req, res) => apiController.getServerKey(req, res));

// Demo packet injection
router.post('/demo/send', (req, res) => apiController.demoSend(req, res));

// Mesh simulator endpoints
router.get('/mesh/state', (req, res) => apiController.meshState(req, res));
router.post('/mesh/gossip', (req, res) => apiController.meshGossip(req, res));
router.post('/mesh/flush', (req, res) => apiController.meshFlush(req, res));
router.post('/mesh/reset', (req, res) => apiController.meshReset(req, res));

// Bridge ingestion endpoint
router.post('/bridge/ingest', (req, res) => apiController.ingest(req, res));

// Query endpoints
router.get('/accounts', (req, res) => apiController.listAccounts(req, res));
router.get('/transactions', (req, res) => apiController.listTransactions(req, res));
router.get('/stats', (req, res) => apiController.getStats(req, res));

// Interactive Security Demos
router.post('/demo/tamper', (req, res) => apiController.demoTamper(req, res));
router.post('/demo/replay', (req, res) => apiController.demoReplay(req, res));
router.post('/demo/concurrent-duplicate', (req, res) => apiController.demoConcurrentDuplicate(req, res));

module.exports = router;
