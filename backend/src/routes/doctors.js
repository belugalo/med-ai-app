const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/auth');
const {
  listDoctors,
  getDoctorById,
  createPrescription,
  listPrescriptions
} = require('../controllers/doctorController');

router.get('/', listDoctors);
router.get('/prescriptions', authenticate, listPrescriptions);
router.post('/prescriptions', authenticate, createPrescription);
router.get('/:id', getDoctorById);

module.exports = router;
