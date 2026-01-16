import express from 'express';
import {
    registerHospital,
    loginHospital,
    getHospitalProfile,
    updateHospitalProfile,
    getHospitalDoctors,
    updateDoctorSettings,
    getHospitalAppointments,
    getHospitalStats
} from '../controllers/hospitalController.js';
import hospitalAuth from '../middleware/hospitalAuth.js';

const hospitalRouter = express.Router();

// Public routes
hospitalRouter.post('/register', registerHospital);
hospitalRouter.post('/login', loginHospital);

// Protected routes (require hospital authentication)
hospitalRouter.get('/profile', hospitalAuth, getHospitalProfile);
hospitalRouter.post('/update-profile', hospitalAuth, updateHospitalProfile);
hospitalRouter.get('/doctors', hospitalAuth, getHospitalDoctors);
hospitalRouter.post('/update-doctor-settings', hospitalAuth, updateDoctorSettings);
hospitalRouter.get('/appointments', hospitalAuth, getHospitalAppointments);
hospitalRouter.get('/stats', hospitalAuth, getHospitalStats);

export default hospitalRouter;
