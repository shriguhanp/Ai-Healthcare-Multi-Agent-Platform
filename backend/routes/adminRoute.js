import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, deleteDoctor, updateDoctor, addHospital, getAllHospitals, updateHospital, deleteHospital } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.post("/update-doctor", authAdmin, upload.single('image'), updateDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.post("/delete-doctor", authAdmin, deleteDoctor)
adminRouter.get("/dashboard", authAdmin, adminDashboard)

// Hospital Routes
adminRouter.post("/add-hospital", authAdmin, upload.single('image'), addHospital)
adminRouter.get("/all-hospitals", authAdmin, getAllHospitals)
adminRouter.post("/update-hospital", authAdmin, upload.single('image'), updateHospital)
adminRouter.post("/delete-hospital", authAdmin, deleteHospital)

export default adminRouter;