import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import hospitalModel from "../models/hospitalModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

// Register hospital
const registerHospital = async (req, res) => {
    try {
        const { name, email, password, phone, registrationNumber, address, departments } = req.body;

        // Validation
        if (!name || !email || !password || !phone || !registrationNumber || !address) {
            return res.json({ success: false, message: "Missing details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        // Check if hospital already exists
        const existingHospital = await hospitalModel.findOne({ email });
        if (existingHospital) {
            return res.json({ success: false, message: "Hospital already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create hospital
        const hospitalData = {
            name,
            email,
            password: hashedPassword,
            phone,
            registrationNumber,
            address,
            departments: departments || [],
            verified: false
        };

        const newHospital = new hospitalModel(hospitalData);
        const hospital = await newHospital.save();

        // Create token
        const token = jwt.sign({ id: hospital._id }, process.env.JWT_SECRET);

        res.json({ success: true, token, message: "Hospital registered successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Hospital login
const loginHospital = async (req, res) => {
    try {
        const { email, password } = req.body;
        const hospital = await hospitalModel.findOne({ email });

        if (!hospital) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, hospital.password);

        if (isMatch) {
            const token = jwt.sign({ id: hospital._id }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get hospital profile
const getHospitalProfile = async (req, res) => {
    try {
        const { hospitalId } = req.body;
        const hospital = await hospitalModel.findById(hospitalId).select('-password');
        res.json({ success: true, hospital });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update hospital profile
const updateHospitalProfile = async (req, res) => {
    try {
        const { hospitalId, name, phone, address, departments, image } = req.body;

        await hospitalModel.findByIdAndUpdate(hospitalId, {
            name,
            phone,
            address,
            departments,
            image
        });

        res.json({ success: true, message: "Profile updated" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all doctors in hospital
const getHospitalDoctors = async (req, res) => {
    try {
        const { hospitalId } = req.body;
        const doctors = await doctorModel.find({ hospitalId }).select('-password');
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update doctor schedule and token limit
const updateDoctorSettings = async (req, res) => {
    try {
        const { hospitalId, docId, tokenLimit, availabilityStatus } = req.body;

        // Verify doctor belongs to this hospital
        const doctor = await doctorModel.findById(docId);
        if (!doctor || doctor.hospitalId !== hospitalId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        const updateData = {};
        if (tokenLimit !== undefined) updateData.tokenLimit = tokenLimit;
        if (availabilityStatus) updateData.availabilityStatus = availabilityStatus;

        await doctorModel.findByIdAndUpdate(docId, updateData);

        res.json({ success: true, message: "Doctor settings updated" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get hospital appointments
const getHospitalAppointments = async (req, res) => {
    try {
        const { hospitalId } = req.body;

        // Get all doctors in this hospital
        const doctors = await doctorModel.find({ hospitalId });
        const doctorIds = doctors.map(doc => doc._id.toString());

        // Get all appointments for these doctors
        const appointments = await appointmentModel.find({
            docId: { $in: doctorIds }
        });

        res.json({ success: true, appointments });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get hospital dashboard statistics
const getHospitalStats = async (req, res) => {
    try {
        const { hospitalId } = req.body;

        const doctors = await doctorModel.find({ hospitalId });
        const doctorIds = doctors.map(doc => doc._id.toString());

        const appointments = await appointmentModel.find({
            docId: { $in: doctorIds }
        });

        const totalDoctors = doctors.length;
        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter(app => app.isCompleted).length;
        const cancelledAppointments = appointments.filter(app => app.cancelled).length;
        const revenue = appointments
            .filter(app => app.payment && !app.cancelled)
            .reduce((sum, app) => sum + app.amount, 0);

        res.json({
            success: true,
            stats: {
                totalDoctors,
                totalAppointments,
                completedAppointments,
                cancelledAppointments,
                revenue
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    registerHospital,
    loginHospital,
    getHospitalProfile,
    updateHospitalProfile,
    getHospitalDoctors,
    updateDoctorSettings,
    getHospitalAppointments,
    getHospitalStats
};
