const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/auth');
const {
  createAppointment,
  listPatientAppointments,
  listDoctorAppointments,
  updateStatus
} = require('../controllers/appointmentController');

router.post('/', authenticate, createAppointment);
router.get('/patient', authenticate, listPatientAppointments);
router.get('/doctor/:doctorId?', authenticate, listDoctorAppointments);
router.patch('/:id/status', authenticate, updateStatus);

module.exports = router;
