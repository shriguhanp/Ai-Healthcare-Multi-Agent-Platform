import express from 'express';
import {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe,
    updateMedicationIntake,
    editMedicine,
    deleteMedicine,
    getNearbyDoctors,
    rateAppointment,
    getAllHospitals
} from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)

// Medication actions: mark intake/missed, edit medicine, and delete medicine
userRouter.post('/medication/intake', authUser, updateMedicationIntake)
userRouter.post('/medication/edit', authUser, editMedicine)
userRouter.post('/medication/delete', authUser, deleteMedicine)

// New advanced routes
userRouter.post('/search-doctors', getNearbyDoctors)
userRouter.post('/rate-appointment', authUser, rateAppointment)
userRouter.get('/hospitals', getAllHospitals)

export default userRouter;