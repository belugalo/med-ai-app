const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 1. Ensure DATABASE_URL is always defined with a robust fallback
if (!process.env.DATABASE_URL) {
  if (process.env.VERCEL) {
    // Vercel serverless functions only have write access to /tmp
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  } else {
    // Local / standard server fallback
    const localDbPath = path.resolve(__dirname, '../../prisma/dev.db');
    process.env.DATABASE_URL = `file:${localDbPath}`;
  }
}

// 2. Global singleton pattern to prevent multiple connections in serverless / dev
let prisma;

if (!global.__prisma_instance) {
  global.__prisma_instance = new PrismaClient();
}
prisma = global.__prisma_instance;

// 3. Auto-initialize SQLite schema and demo seeds if running on a fresh/ephemeral database
let isInitialized = false;

async function ensureDbInitialized() {
  if (isInitialized) return;
  try {
    // Only auto-create tables if using SQLite
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.startsWith('file:') || dbUrl.includes('.db') || dbUrl.includes('sqlite')) {
      // Execute SQLite DDL statements safely
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT,
          "role" TEXT NOT NULL DEFAULT 'PATIENT',
          "phone" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Doctor" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "userId" INTEGER NOT NULL,
          "specialization" TEXT NOT NULL,
          "licenseNumber" TEXT NOT NULL,
          "bio" TEXT,
          "hospital" TEXT DEFAULT 'MedAI Health Center',
          "experienceYrs" INTEGER DEFAULT 5,
          "rating" REAL DEFAULT 4.9,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Doctor_userId_key" ON "Doctor"("userId");`);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Appointment" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "patientId" INTEGER NOT NULL,
          "doctorId" INTEGER NOT NULL,
          "scheduledAt" DATETIME NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "reason" TEXT,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Prescription" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "doctorId" INTEGER NOT NULL,
          "patientId" INTEGER NOT NULL,
          "medications" TEXT NOT NULL,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChatSession" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "patientId" INTEGER NOT NULL,
          "doctorId" INTEGER,
          "title" TEXT DEFAULT 'General Health Consultation',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ChatSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Message" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "sessionId" INTEGER NOT NULL,
          "senderId" INTEGER,
          "role" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "meta" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      // Check if users exist; if not, seed default doctors & demo patient
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        const passwordHash = await bcrypt.hash('password', 10);

        // Demo Patient
        const patient = await prisma.user.create({
          data: {
            email: 'alice@example.com',
            password: passwordHash,
            name: 'Alice Johnson',
            role: 'PATIENT',
            phone: '+1 (555) 234-5678'
          }
        });

        // Doctor 1: Dr. Robert Taylor
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

        // Doctor 2: Dr. Claire Vance
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
            specialization: 'Cardiology & Cardiovascular Health',
            licenseNumber: 'MD-912044',
            bio: 'Cardiologist specializing in hypertension, arrhythmias, preventative heart health, and remote cardiac monitoring.',
            hospital: 'Apex Heart & Vascular Institute',
            experienceYrs: 15,
            rating: 4.98
          }
        });

        // Doctor 3: Dr. Marcus Lee
        const docUser3 = await prisma.user.create({
          data: {
            email: 'drmarcus@example.com',
            password: passwordHash,
            name: 'Dr. Marcus Lee, MD',
            role: 'DOCTOR',
            phone: '+1 (555) 567-8901'
          }
        });
        const doctor3 = await prisma.doctor.create({
          data: {
            userId: docUser3.id,
            specialization: 'Pediatrics & Adolescent Medicine',
            licenseNumber: 'MD-330192',
            bio: 'Compassionate pediatrician focusing on childhood development, viral respiratory triage, and preventative wellness.',
            hospital: 'Childrens Hope Medical Pavilion',
            experienceYrs: 9,
            rating: 4.88
          }
        });

        // Seed an appointment for demo patient
        await prisma.appointment.create({
          data: {
            patientId: patient.id,
            doctorId: doctor1.id,
            scheduledAt: new Date(Date.now() + 86400000 * 2), // 2 days from now
            status: 'CONFIRMED',
            reason: 'Annual Preventive Health Checkup',
            notes: 'Patient requested review of seasonal allergies and routine bloodwork.'
          }
        });
      }
    }
    isInitialized = true;
  } catch (err) {
    console.warn('Note: DB auto-init warning (non-fatal):', err.message);
  }
}

// Auto-trigger initialization in background
ensureDbInitialized().catch(() => {});

module.exports = prisma;
