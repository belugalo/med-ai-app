const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.message.deleteMany().catch(() => {});
  await prisma.chatSession.deleteMany().catch(() => {});
  await prisma.prescription.deleteMany().catch(() => {});
  await prisma.appointment.deleteMany().catch(() => {});
  await prisma.doctor.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  console.log('Seeding initial users and doctors...');
  const passwordHash = await bcrypt.hash('password', 10);

  // Demo Patient Alice
  const patient = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: passwordHash,
      name: 'Alice Johnson',
      role: 'PATIENT',
      phone: '+1 (555) 234-5678'
    }
  });

  // Demo Patient Bob
  const patientBob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: passwordHash,
      name: 'Bob Miller',
      role: 'PATIENT',
      phone: '+1 (555) 876-5432'
    }
  });

  // Demo Doctor 1: Dr. Robert Taylor (General Medicine)
  const docUser1 = await prisma.user.create({
    data: {
      email: 'drbob@example.com',
      password: passwordHash,
      name: 'Dr. Robert Taylor, MD',
      role: 'DOCTOR',
      phone: '+1 (555) 345-6789'
    }
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      userId: docUser1.id,
      specialization: 'Internal Medicine & General Practice',
      licenseNumber: 'MD-884920',
      bio: 'Board-certified Internal Medicine physician with over 12 years of clinical triage and chronic care management experience.',
      hospital: 'Metro Health University Clinic',
      experienceYrs: 12,
      rating: 4.95
    }
  });

  // Demo Doctor 2: Dr. Claire Vance (Cardiology)
  const docUser2 = await prisma.user.create({
    data: {
      email: 'drclaire@example.com',
      password: passwordHash,
      name: 'Dr. Claire Vance, MD',
      role: 'DOCTOR',
      phone: '+1 (555) 456-7890'
    }
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: docUser2.id,
      specialization: 'Cardiology & Vascular Health',
      licenseNumber: 'MD-991204',
      bio: 'Cardiologist specializing in cardiovascular preventative care, arrhythmias, and hypertension management.',
      hospital: 'St. Jude Heart & Vascular Institute',
      experienceYrs: 15,
      rating: 4.98
    }
  });

  // Demo Doctor 3: Dr. Marcus Patel (Neurology & Headache)
  const docUser3 = await prisma.user.create({
    data: {
      email: 'drmarcus@example.com',
      password: passwordHash,
      name: 'Dr. Marcus Patel, MD',
      role: 'DOCTOR',
      phone: '+1 (555) 567-8901'
    }
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      userId: docUser3.id,
      specialization: 'Neurology & Headache Specialist',
      licenseNumber: 'MD-772911',
      bio: 'Specialist in migraine diagnosis, vestibular disorders, and sleep-related neurological care.',
      hospital: 'Apex Neurosciences Center',
      experienceYrs: 9,
      rating: 4.92
    }
  });

  // Demo Appointment for Alice with Dr. Bob
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor1.id,
      scheduledAt: tomorrow,
      status: 'CONFIRMED',
      reason: 'Routine seasonal checkup and mild allergy follow-up',
      notes: 'Please bring recent lab results if available.'
    }
  });

  // Sample Chat Session for Alice
  const session = await prisma.chatSession.create({
    data: {
      patientId: patient.id,
      title: 'Headache & Mild Dizziness Consultation'
    }
  });

  await prisma.message.create({
    data: {
      sessionId: session.id,
      senderId: patient.id,
      role: 'patient',
      content: 'I have had a throbbing headache since yesterday morning along with slight sensitivity to bright lights.'
    }
  });

  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: 'bot',
      content: 'Based on your symptoms (throbbing headache with light sensitivity), these are characteristic features of a tension or migraine-type headache.',
      meta: JSON.stringify({
        risk: 'medium',
        confidence_score: 0.88,
        specialty: 'Neurology / General Practice',
        suggestions: [
          'Rest in a quiet, dark room and stay well hydrated',
          'Avoid excessive screen time and bright lights',
          'Consider mild OTC pain relief if suitable for you',
          'Consult a physician if accompanied by fever, neck stiffness, or vision loss'
        ],
        followup_questions: [
          'Is the headache on one side of your head or both?',
          'Are you experiencing any nausea or vomiting?'
        ]
      })
    }
  });

  console.log('Seeding completed successfully!');
  console.log('Demo Accounts:');
  console.log('  Patient: alice@example.com / password');
  console.log('  Patient: bob@example.com / password');
  console.log('  Doctor 1: drbob@example.com / password');
  console.log('  Doctor 2: drclaire@example.com / password');
  console.log('  Doctor 3: drmarcus@example.com / password');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
