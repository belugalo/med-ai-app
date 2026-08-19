const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const llm = require('../lib/llm');

exports.listSessions = async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { patientId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const parsed = sessions.map(s => ({
      ...s,
      messages: s.messages.map(m => ({
        ...m,
        meta: m.meta ? JSON.parse(m.meta) : null
      }))
    }));

    res.json({ sessions: parsed });
  } catch (e) {
    console.error('List sessions error:', e);
    res.status(500).json({ error: 'Failed to list chat sessions' });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { title } = req.body;
    const session = await prisma.chatSession.create({
      data: {
        patientId: req.userId,
        title: title || 'New Health Consultation'
      }
    });
    res.status(201).json({ session: { ...session, messages: [] } });
  } catch (e) {
    console.error('Create session error:', e);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session || (session.patientId !== req.userId && req.userRole !== 'DOCTOR')) {
      return res.status(404).json({ error: 'Session not found or access denied' });
    }

    res.json({
      session: {
        ...session,
        messages: session.messages.map(m => ({
          ...m,
          meta: m.meta ? JSON.parse(m.meta) : null
        }))
      }
    });
  } catch (e) {
    console.error('Get session error:', e);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: true }
    });

    if (!session || session.patientId !== req.userId) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Save patient message
    const patientMsg = await prisma.message.create({
      data: {
        sessionId,
        senderId: req.userId,
        role: 'patient',
        content: text.trim()
      }
    });

    // Run clinical assessment
    const triageResult = await llm.analyzeSymptoms({
      text: text.trim(),
      history: session.messages
    });

    // Save bot message
    const botMsg = await prisma.message.create({
      data: {
        sessionId,
        role: 'bot',
        content: triageResult.text,
        meta: JSON.stringify(triageResult.structured)
      }
    });

    // Auto-update session title if it's default
    if (session.title === 'New Health Consultation' || session.title === 'General Health Consultation') {
      const summaryTitle = triageResult.structured?.possibleCondition || (text.slice(0, 30) + '...');
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: summaryTitle }
      });
    }

    res.json({
      ok: true,
      patientMessage: patientMsg,
      botMessage: {
        ...botMsg,
        meta: triageResult.structured
      },
      structured: triageResult.structured,
      content: triageResult.text
    });
  } catch (e) {
    console.error('Post message error:', e);
    res.status(500).json({ error: 'Failed to process medical triage message' });
  }
};
