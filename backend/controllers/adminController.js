import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import hospitalModel from "../models/hospitalModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const email = req.body.email?.trim();
        const password = req.body.password?.trim();
        
        // Use environment variables or hardcoded fallback for requested credentials
        const expectedEmail = process.env.ADMIN_EMAIL || "shriguhan7@gmail.com";
        const expectedPassword = process.env.ADMIN_PASSWORD || "12345";

        if (email === expectedEmail && password === expectedPassword) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET || "greatstack")
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for adding Doctor
const addDoctor = async (req, res) => {

    try {

        const { name, email, password, speciality, degree, experience, about, fees, address, location } = req.body
        const imageFile = req.file

        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }

        // Add location data if provided
        if (location) {
            const locationData = JSON.parse(location)
            doctorData.location = {
                city: locationData.city || '',
                country: locationData.country || 'India',
                area: locationData.area || '',
                pincode: locationData.pincode || ''
            }
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({ success: true, message: 'Doctor Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to delete doctor for admin panel
const deleteDoctor = async (req, res) => {
    try {
        const { docId } = req.body
        await doctorModel.findByIdAndDelete(docId)
        res.json({ success: true, message: "Doctor Deleted" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor for admin panel
const updateDoctor = async (req, res) => {
    try {
        const { docId, name, email, speciality, degree, experience, about, fees, address, location, available } = req.body
        const imageFile = req.file

        const updateData = {
            name,
            email,
            speciality,
            degree,
            experience,
            about,
            fees: Number(fees),
            address: JSON.parse(address),
            available: available === 'true' || available === true
        }

        if (location) {
            const locationData = JSON.parse(location)
            updateData.location = {
                city: locationData.city || '',
                country: locationData.country || 'India',
                area: locationData.area || '',
                pincode: locationData.pincode || ''
            }
        }

        if (imageFile) {
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageUrl = imageUpload.secure_url
            updateData.image = imageUrl
        }

        await doctorModel.findByIdAndUpdate(docId, updateData)
        res.json({ success: true, message: 'Doctor Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to add hospital
const addHospital = async (req, res) => {
    try {
        const { name, email, phone, about, timings, registrationNumber, address, doctorIds } = req.body
        const imageFile = req.file

        if (!name || !email || !phone || !about || !timings || !registrationNumber || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        const hospitalData = {
            name,
            email,
            phone,
            about,
            timings,
            registrationNumber,
            image: imageUrl,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newHospital = new hospitalModel(hospitalData)
        const savedHospital = await newHospital.save()

        // If doctors are selected, update their hospitalId
        if (doctorIds) {
            const doctors = JSON.parse(doctorIds)
            if (doctors.length > 0) {
                await doctorModel.updateMany(
                    { _id: { $in: doctors } },
                    { $set: { hospitalId: savedHospital._id } }
                )

                // Update total doctors count
                savedHospital.totalDoctors = doctors.length
                await savedHospital.save()
            }
        }

        res.json({ success: true, message: "Hospital Added Successfully" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all hospitals
const getAllHospitals = async (req, res) => {
    try {
        const hospitals = await hospitalModel.find({})
        res.json({ success: true, hospitals })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update hospital
const updateHospital = async (req, res) => {
    try {
        const { hospitalId, name, email, phone, about, timings, registrationNumber, address } = req.body
        const imageFile = req.file

        const updateData = {
            name,
            email,
            phone,
            about,
            timings,
            registrationNumber,
            address: JSON.parse(address)
        }

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            updateData.image = imageUpload.secure_url
        }

        await hospitalModel.findByIdAndUpdate(hospitalId, updateData)
        res.json({ success: true, message: "Hospital Updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to delete hospital
const deleteHospital = async (req, res) => {
    try {
        const { hospitalId } = req.body
        await hospitalModel.findByIdAndDelete(hospitalId)
        res.json({ success: true, message: "Hospital Deleted" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    deleteDoctor,
    updateDoctor,
    addHospital,
    getAllHospitals,
    updateHospital,
    deleteHospital
}