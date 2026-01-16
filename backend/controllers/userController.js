import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import hospitalModel from "../models/hospitalModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')
const razorpayInstance = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET 
    ? new razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    : null;

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
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

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        // ensure docName is present for each prescription entry
        if (userData && Array.isArray(userData.medicalAdherence)) {
            for (let entry of userData.medicalAdherence) {
                try {
                    if ((!entry.docName || entry.docName === 'N/A') && entry.docId) {
                        const doc = await doctorModel.findById(entry.docId).select('name')
                        entry.docName = doc ? doc.name : 'Unknown Doctor'
                    }
                } catch (e) {
                    // ignore per-entry errors
                    entry.docName = entry.docName || 'Unknown Doctor'
                }
            }
        }

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime } = req.body
        const docData = await doctorModel.findById(docId).select("-password")

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        // Check availability status
        if (docData.availabilityStatus === 'Unavailable') {
            return res.json({ success: false, message: 'Doctor is currently unavailable' })
        }

        // Check token availability
        if (docData.currentTokenCount >= docData.tokenLimit) {
            return res.json({ success: false, message: 'Token Full - No more appointments available today' })
        }

        let slots_booked = docData.slots_booked

        // checking for slot availablity 
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' })
            }
            else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select("-password")

        delete docData.slots_booked

        // Assign token number
        const tokenNumber = docData.currentTokenCount + 1;

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            tokenNumber
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save new slots data and increment token count in docData
        await doctorModel.findByIdAndUpdate(docId, {
            slots_booked,
            currentTokenCount: tokenNumber
        })

        res.json({ success: true, message: 'Appointment Booked', tokenNumber })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        if (!razorpayInstance) {
            return res.json({ success: false, message: 'Razorpay payment gateway is not configured' })
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body

        if (!razorpayInstance) {
            return res.json({ success: false, message: 'Razorpay payment gateway is not configured' })
        }

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
            res.json({ success: true, message: "Payment Successful" })
        }
        else {
            res.json({ success: false, message: 'Payment Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark medicine intake (taken/missed) and auto-delete when days complete
const updateMedicationIntake = async (req, res) => {
    try {
        const { userId, entryDate, medIndex, action } = req.body

        if (!userId || entryDate == null || medIndex == null || !action) {
            return res.json({ success: false, message: 'Missing data' })
        }

        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })

        const entry = (user.medicalAdherence || []).find(e => String(e.date) === String(entryDate))
        if (!entry) return res.json({ success: false, message: 'Prescription entry not found' })

        const med = entry.medicines && entry.medicines[medIndex]
        if (!med) return res.json({ success: false, message: 'Medicine not found' })

        // For both taken or missed we consider the day has passed and decrement days
        med.days = (Number(med.days) || 0) - 1

        // Optionally you could record history of taken/missed; skipping for simplicity

        if (med.days <= 0) {
            // remove this medicine
            entry.medicines.splice(medIndex, 1)
        }

        // if no medicines left in entry, remove the whole entry
        if (!entry.medicines || entry.medicines.length === 0) {
            user.medicalAdherence = (user.medicalAdherence || []).filter(e => String(e.date) !== String(entryDate))
        }

        await user.save()

        const returnUser = await userModel.findById(userId).select('-password')
        res.json({ success: true, message: 'Updated', userData: returnUser })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to edit a medicine inside a prescription entry
const editMedicine = async (req, res) => {
    try {
        const { userId, entryDate, medIndex, updates } = req.body
        if (!userId || entryDate == null || medIndex == null || !updates) {
            return res.json({ success: false, message: 'Missing data' })
        }

        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })

        const entry = (user.medicalAdherence || []).find(e => String(e.date) === String(entryDate))
        if (!entry) return res.json({ success: false, message: 'Prescription entry not found' })

        const med = entry.medicines && entry.medicines[medIndex]
        if (!med) return res.json({ success: false, message: 'Medicine not found' })

        // apply allowed updates
        const allowed = ['name', 'dosage', 'times', 'meal', 'days']
        allowed.forEach(k => {
            if (updates[k] !== undefined) med[k] = updates[k]
        })

        // remove medicine if days set to 0 or less
        if (Number(med.days) <= 0) {
            entry.medicines.splice(medIndex, 1)
        }

        if (!entry.medicines || entry.medicines.length === 0) {
            user.medicalAdherence = (user.medicalAdherence || []).filter(e => String(e.date) !== String(entryDate))
        }

        await user.save()

        const returnUser = await userModel.findById(userId).select('-password')
        res.json({ success: true, message: 'Medicine updated', userData: returnUser })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to delete a medicine
const deleteMedicine = async (req, res) => {
    try {
        const { userId, entryDate, medIndex } = req.body
        if (!userId || entryDate == null || medIndex == null) {
            return res.json({ success: false, message: 'Missing data' })
        }

        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })

        const entry = (user.medicalAdherence || []).find(e => String(e.date) === String(entryDate))
        if (!entry) return res.json({ success: false, message: 'Prescription entry not found' })

        const med = entry.medicines && entry.medicines[medIndex]
        if (!med) return res.json({ success: false, message: 'Medicine not found' })

        entry.medicines.splice(medIndex, 1)

        if (!entry.medicines || entry.medicines.length === 0) {
            user.medicalAdherence = (user.medicalAdherence || []).filter(e => String(e.date) !== String(entryDate))
        }

        await user.save()

        const returnUser = await userModel.findById(userId).select('-password')
        res.json({ success: true, message: 'Medicine deleted successfully', userData: returnUser })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to search nearby doctors based on location
const getNearbyDoctors = async (req, res) => {
    try {
        const { city, area, pincode, country, specialty, availability, maxDistance, sortBy } = req.body;

        let query = {};

        // Location filtering
        if (pincode) {
            query['location.pincode'] = pincode;
        }

        if (country) {
            query['location.country'] = country;
        }

        if (city || area) {
            const locationOr = [];
            if (city) locationOr.push({ 'location.city': { $regex: city, $options: 'i' } });
            if (area) locationOr.push({ 'location.area': { $regex: area, $options: 'i' } });
            if (locationOr.length) query.$or = locationOr;
        }

        // Specialty filter
        if (specialty) {
            query.speciality = { $regex: specialty, $options: 'i' };
        }

        // Availability filter
        if (availability) {
            query.availabilityStatus = availability;
        }

        // Get doctors
        let doctors = await doctorModel.find(query).select('-password');

        // Add token availability status and distance
        doctors = doctors.map(doc => {
            const docObj = doc.toObject();
            docObj.tokenAvailable = docObj.currentTokenCount < docObj.tokenLimit;
            docObj.tokensRemaining = docObj.tokenLimit - docObj.currentTokenCount;
            return docObj;
        });

        // Sort by rating, distance, or availability
        if (sortBy === 'rating') {
            doctors.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'tokenAvailable') {
            doctors.sort((a, b) => b.tokensRemaining - a.tokensRemaining);
        }

        res.json({ success: true, doctors });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all hospitals for frontend
const getAllHospitals = async (req, res) => {
    try {
        const hospitals = await hospitalModel.find({}).select('-password -email -phone')
        res.json({ success: true, hospitals })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to rate an appointment
const rateAppointment = async (req, res) => {
    try {
        const { appointmentId, rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || !appointment.isCompleted) {
            return res.json({ success: false, message: 'Can only rate completed appointments' });
        }

        // Update appointment
        await appointmentModel.findByIdAndUpdate(appointmentId, { rating, review });

        // Update doctor's average rating
        const doctor = await doctorModel.findById(appointment.docId);
        const newTotalRatings = doctor.totalRatings + 1;
        const newRating = ((doctor.rating * doctor.totalRatings) + rating) / newTotalRatings;

        await doctorModel.findByIdAndUpdate(appointment.docId, {
            rating: newRating.toFixed(2),
            totalRatings: newTotalRatings
        });

        res.json({ success: true, message: 'Rating submitted successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
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
    // Advanced features
    getNearbyDoctors,
    rateAppointment,
    getAllHospitals
}