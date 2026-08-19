const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, scheduledAt, reason, notes } = req.body;
    if (!doctorId || !scheduledAt) {
      return res.status(400).json({ error: 'Doctor ID and scheduled date/time are required' });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: Number(doctorId) } });
    if (!doctor) {
      return res.status(404).json({ error: 'Selected doctor not found' });
    }

    const appt = await prisma.appointment.create({
      data: {
        patientId: req.userId,
        doctorId: Number(doctorId),
        scheduledAt: new Date(scheduledAt),
        reason: reason || 'General Consultation',
        notes: notes || null,
        status: 'CONFIRMED'
      },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        patient: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    res.status(201).json({ appointment: appt });
  } catch (e) {
    console.error('Create appointment error:', e);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

exports.listPatientAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.userId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        }
      }
    });
    res.json({ appointments });
  } catch (e) {
    console.error('List patient appointments error:', e);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

exports.listDoctorAppointments = async (req, res) => {
  try {
    let doctorId = Number(req.params.doctorId);

    // If doctor is logged in, find their doctor ID
    if (!doctorId || isNaN(doctorId)) {
      const doctorProfile = await prisma.doctor.findUnique({ where: { userId: req.userId } });
      if (!doctorProfile) {
        return res.status(403).json({ error: 'No doctor profile associated with this account' });
      }
      doctorId = doctorProfile.id;
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    res.json({ appointments });
  } catch (e) {
    console.error('List doctor appointments error:', e);
    res.status(500).json({ error: 'Failed to fetch doctor appointments' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, notes } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        patient: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({ appointment: updated });
  } catch (e) {
    console.error('Update appointment status error:', e);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};
