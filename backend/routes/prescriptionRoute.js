import express from 'express';
import {
    createPrescription,
    getPrescription,
    getPatientPrescriptions,
    getDoctorPrescriptions,
    updatePrescription,
    downloadPrescription
} from '../controllers/prescriptionController.js';
import authUser from '../middleware/authUser.js';
import authDoctor from '../middleware/authDoctor.js';

const prescriptionRouter = express.Router();

// Doctor routes (create, update)
prescriptionRouter.post('/create', authDoctor, createPrescription);
prescriptionRouter.put('/update/:prescriptionId', authDoctor, updatePrescription);
prescriptionRouter.get('/doctor/:doctorId', authDoctor, getDoctorPrescriptions);

// Patient routes (view, download)
prescriptionRouter.get('/:prescriptionId', getPrescription);
prescriptionRouter.get('/patient/:patientId', authUser, getPatientPrescriptions);
prescriptionRouter.get('/download/:prescriptionId', downloadPrescription);

export default prescriptionRouter;
