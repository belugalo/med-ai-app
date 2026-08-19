const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/auth');
const { listSessions, createSession, getSession, postMessage } = require('../controllers/chatController');

router.get('/sessions', authenticate, listSessions);
router.post('/sessions', authenticate, createSession);
router.get('/sessions/:sessionId', authenticate, getSession);
router.post('/:sessionId/message', authenticate, postMessage);

module.exports = router;
