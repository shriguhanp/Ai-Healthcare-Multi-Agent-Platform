import express from 'express';
import {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    getPatients,
    prescribePatient,
    updateAvailabilityStatus,
    getTokenInfo,
    updateLocation,
    getDoctorPrescriptions,
    updatePrescription,
    deletePrescription
} from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/list", doctorList)
doctorRouter.get("/patients", authDoctor, getPatients)
doctorRouter.post("/prescribe", authDoctor, prescribePatient)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)
// New advanced routes
doctorRouter.post("/update-status", authDoctor, updateAvailabilityStatus)
doctorRouter.get("/token-info", authDoctor, getTokenInfo)
doctorRouter.post("/update-location", authDoctor, updateLocation)
// Prescription management routes
doctorRouter.post("/prescriptions", authDoctor, getDoctorPrescriptions)
doctorRouter.put("/prescription/update", authDoctor, updatePrescription)
doctorRouter.delete("/prescription/delete", authDoctor, deletePrescription)

export default doctorRouter;