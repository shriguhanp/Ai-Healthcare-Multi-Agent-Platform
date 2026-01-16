import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    about: { type: String, required: true },
    timings: { type: String, required: true }, // e.g., "09:00 AM - 09:00 PM"
    image: { type: String, default: '' },
    registrationNumber: { type: String, required: true, unique: true },
    address: {
        line1: { type: String, required: true },
        line2: { type: String, default: '' },
        city: { type: String, required: true },
        area: { type: String, default: '' },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' },
        coordinates: {
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 }
        }
    },
    departments: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    totalDoctors: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    date: { type: Number, default: Date.now }
}, { minimize: false });

const hospitalModel = mongoose.models.hospital || mongoose.model("hospital", hospitalSchema);
export default hospitalModel;
