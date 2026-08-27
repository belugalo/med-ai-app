const prisma = require('../lib/prisma');

exports.listDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      },
      orderBy: { rating: 'desc' }
    });
    res.json({ doctors });
  } catch (e) {
    console.error('List doctors error:', e);
    res.status(500).json({ error: 'Failed to fetch doctors list' });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ doctor });
  } catch (e) {
    console.error('Get doctor error:', e);
    res.status(500).json({ error: 'Failed to fetch doctor details' });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const { patientId, medications, notes } = req.body;
    if (!patientId || !medications) {
      return res.status(400).json({ error: 'Patient ID and medications list are required' });
    }

    const doctorProfile = await prisma.doctor.findUnique({ where: { userId: req.userId } });
    if (!doctorProfile) {
      return res.status(403).json({ error: 'Only registered doctors can issue prescriptions' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        doctorId: doctorProfile.id,
        patientId: Number(patientId),
        medications: typeof medications === 'string' ? medications : JSON.stringify(medications),
        notes: notes || null
      },
      include: {
        doctor: { include: { user: { select: { name: true, email: true } } } },
        patient: { select: { name: true, email: true } }
      }
    });

    res.status(201).json({
      prescription: {
        ...prescription,
        medications: JSON.parse(prescription.medications)
      }
    });
  } catch (e) {
    console.error('Create prescription error:', e);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
};

exports.listPrescriptions = async (req, res) => {
  try {
    let prescriptions;
    if (req.userRole === 'DOCTOR') {
      const doctorProfile = await prisma.doctor.findUnique({ where: { userId: req.userId } });
      prescriptions = await prisma.prescription.findMany({
        where: { doctorId: doctorProfile?.id || 0 },
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          doctor: { include: { user: { select: { name: true } } } }
        }
      });
    } else {
      prescriptions = await prisma.prescription.findMany({
        where: { patientId: req.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { include: { user: { select: { name: true, email: true } } } }
        }
      });
    }

    const parsed = prescriptions.map(p => ({
      ...p,
      medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : p.medications
    }));

    res.json({ prescriptions: parsed });
  } catch (e) {
    console.error('List prescriptions error:', e);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};
