import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all patients for doctor panel
const getPatients = async (req, res) => {
    try {
        const users = await userModel.find({}).select('-password')
        res.json({ success: true, users })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for doctor to add prescription to a patient
const prescribePatient = async (req, res) => {
    try {
        const { userId, prescription, docId } = req.body
        if (!userId || !prescription) {
            return res.json({ success: false, message: 'Missing data' })
        }

        // Fetch doctor name if docId provided
        let docName = 'Unknown Doctor'
        if (docId) {
            const doctor = await doctorModel.findById(docId).select('name')
            if (doctor) {
                docName = doctor.name
            }
        }

        // add doctor id, name, and date
        const entry = {
            ...prescription,
            docId: docId || null,
            docName: docName,
            date: Date.now()
        }

        await userModel.findByIdAndUpdate(userId, { $push: { medicalAdherence: entry } })
        res.json({ success: true, message: 'Prescription added' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available, about, location } = req.body

        const updateData = {
            fees,
            address,
            available,
            ...(about && { about }),
            ...(location && { location })
        }

        await doctorModel.findByIdAndUpdate(docId, updateData)

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor availability status (Available/Unavailable/Busy)
const updateAvailabilityStatus = async (req, res) => {
    try {
        const { docId, status } = req.body;

        if (!['Available', 'Unavailable', 'Busy'].includes(status)) {
            return res.json({ success: false, message: 'Invalid status' });
        }

        await doctorModel.findByIdAndUpdate(docId, { availabilityStatus: status });
        res.json({ success: true, message: 'Status updated' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get doctor token information
const getTokenInfo = async (req, res) => {
    try {
        const { docId } = req.body;
        const doctor = await doctorModel.findById(docId).select('tokenLimit currentTokenCount lastTokenReset');

        res.json({ success: true, tokenInfo: doctor });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update doctor location
const updateLocation = async (req, res) => {
    try {
        const { docId, location } = req.body;

        await doctorModel.findByIdAndUpdate(docId, { location });
        res.json({ success: true, message: 'Location updated' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const getDoctorPrescriptions = async (req, res) => {
    try {
        const { docId } = req.body;

        if (!docId) {
            return res.json({ success: false, message: 'Doctor ID required' });
        }

        const users = await userModel.find(
            { 'medicalAdherence.docId': docId },
            { _id: 1, name: 1, email: 1, medicalAdherence: 1 }
        );

        const prescriptions = [];
        users.forEach(user => {
            user.medicalAdherence.forEach((entry, idx) => {
                if (entry.docId === docId) {
                    prescriptions.push({
                        _id: `${user._id}-${idx}`,
                        userId: user._id,
                        userName: user.name,
                        userEmail: user.email,
                        medicines: entry.medicines,
                        date: entry.date,
                        docName: entry.docName,
                        entryIndex: idx,
                        docId: entry.docId
                    });
                }
            });
        });

        res.json({ success: true, prescriptions: prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date)) });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updatePrescription = async (req, res) => {
    try {
        const { userId, entryIndex, medicines, docId } = req.body;

        if (!userId || entryIndex === undefined || !medicines) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const user = await userModel.findById(userId);
        if (!user || !user.medicalAdherence[entryIndex]) {
            return res.json({ success: false, message: 'Prescription not found' });
        }

        if (user.medicalAdherence[entryIndex].docId !== docId) {
            return res.json({ success: false, message: 'Unauthorized to edit this prescription' });
        }

        user.medicalAdherence[entryIndex].medicines = medicines;
        await user.save();

        res.json({ success: true, message: 'Prescription updated successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const deletePrescription = async (req, res) => {
    try {
        const { userId, entryIndex, docId } = req.body;

        if (!userId || entryIndex === undefined) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const user = await userModel.findById(userId);
        if (!user || !user.medicalAdherence[entryIndex]) {
            return res.json({ success: false, message: 'Prescription not found' });
        }

        if (user.medicalAdherence[entryIndex].docId !== docId) {
            return res.json({ success: false, message: 'Unauthorized to delete this prescription' });
        }

        user.medicalAdherence.splice(entryIndex, 1);
        await user.save();

        res.json({ success: true, message: 'Prescription deleted successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    // new endpoints
    getPatients,
    prescribePatient,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    // Advanced features
    updateAvailabilityStatus,
    getTokenInfo,
    updateLocation,
    // Prescription management
    getDoctorPrescriptions,
    updatePrescription,
    deletePrescription
}