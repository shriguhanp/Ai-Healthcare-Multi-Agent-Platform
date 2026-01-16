import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    // New fields for advanced features
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'hospital', default: null },
    hospitalName: { type: String, default: '' },
    location: {
        city: { type: String, default: '' },
        country: { type: String, default: 'India' },
        area: { type: String, default: '' },
        pincode: { type: String, default: '' },
        coordinates: {
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 }
        }
    },
    tokenLimit: { type: Number, default: 30 },
    currentTokenCount: { type: Number, default: 0 },
    availabilityStatus: {
        type: String,
        enum: ['Available', 'Unavailable', 'Busy'],
        default: 'Available'
    },
    lastTokenReset: { type: Number, default: Date.now },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 }
}, { minimize: false })

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);
export default doctorModel;