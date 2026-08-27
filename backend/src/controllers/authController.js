const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_med_ai_secret_jwt_key_2026_secure';

exports.register = async (req, res) => {
  try {
    const { email, password, name, role, phone, specialization, licenseNumber, bio } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name || (userRole === 'DOCTOR' ? 'Dr. Provider' : 'Patient'),
        role: userRole,
        phone: phone || null
      }
    });

    if (userRole === 'DOCTOR') {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          specialization: specialization || 'General Medicine',
          licenseNumber: licenseNumber || `MD-${Math.floor(100000 + Math.random() * 900000)}`,
          bio: bio || 'Medical Practitioner at MedAI Health'
        }
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      },
      token
    });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: e.message || 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { doctor: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        doctor: user.doctor
      },
      token
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message || 'Login failed' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { doctor: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        doctor: user.doctor
      }
    });
  } catch (e) {
    console.error('Me query error:', e);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};
