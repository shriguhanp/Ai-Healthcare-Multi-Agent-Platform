import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },
    doctorName: { type: String, required: true },
    patientName: { type: String, required: true },
    diagnosis: { type: String, required: true },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        notes: { type: String, default: '' }
    }],
    additionalNotes: { type: String, default: '' },
    date: { type: Number, default: Date.now },
    isActive: { type: Boolean, default: true }
}, { minimize: false });

const prescriptionModel = mongoose.models.prescription || mongoose.model("prescription", prescriptionSchema);
export default prescriptionModel;
