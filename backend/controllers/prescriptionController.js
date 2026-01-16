import prescriptionModel from "../models/prescriptionModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Create prescription
const createPrescription = async (req, res) => {
    try {
        const { appointmentId, doctorId, patientId, diagnosis, medicines, additionalNotes } = req.body;

        // Verify appointment exists and is completed
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        if (!appointment.isCompleted) {
            return res.json({ success: false, message: "Cannot create prescription for incomplete appointment" });
        }

        // Get doctor and patient names
        const doctor = await doctorModel.findById(doctorId);
        const patient = await userModel.findById(patientId);

        const prescriptionData = {
            appointmentId,
            doctorId,
            patientId,
            doctorName: doctor.name,
            patientName: patient.name,
            diagnosis,
            medicines,
            additionalNotes
        };

        const prescription = new prescriptionModel(prescriptionData);
        await prescription.save();

        // Link prescription to appointment
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            prescriptionId: prescription._id
        });

        res.json({ success: true, prescription, message: "Prescription created successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get prescription by ID
const getPrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const prescription = await prescriptionModel.findById(prescriptionId);

        if (!prescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        res.json({ success: true, prescription });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all prescriptions for a patient
const getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await prescriptionModel.find({ patientId }).sort({ date: -1 });

        res.json({ success: true, prescriptions });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all prescriptions by a doctor
const getDoctorPrescriptions = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const prescriptions = await prescriptionModel.find({ doctorId }).sort({ date: -1 });

        res.json({ success: true, prescriptions });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update prescription
const updatePrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const { diagnosis, medicines, additionalNotes } = req.body;

        await prescriptionModel.findByIdAndUpdate(prescriptionId, {
            diagnosis,
            medicines,
            additionalNotes
        });

        res.json({ success: true, message: "Prescription updated successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Download prescription as PDF
const downloadPrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const prescription = await prescriptionModel.findById(prescriptionId);

        if (!prescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        // Create PDF
        const doc = new PDFDocument();
        const fileName = `prescription-${prescriptionId}.pdf`;
        const filePath = path.join('uploads', 'prescriptions', fileName);

        // Ensure directory exists
        if (!fs.existsSync('uploads/prescriptions')) {
            fs.mkdirSync('uploads/prescriptions', { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // PDF Content
        doc.fontSize(20).text('Medical Prescription', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Doctor: ${prescription.doctorName}`);
        doc.text(`Patient: ${prescription.patientName}`);
        doc.text(`Date: ${new Date(prescription.date).toLocaleDateString()}`);
        doc.moveDown();
        doc.fontSize(14).text('Diagnosis:', { underline: true });
        doc.fontSize(12).text(prescription.diagnosis);
        doc.moveDown();
        doc.fontSize(14).text('Medicines:', { underline: true });

        prescription.medicines.forEach((med, index) => {
            doc.fontSize(12);
            doc.text(`${index + 1}. ${med.name}`);
            doc.text(`   Dosage: ${med.dosage}`);
            doc.text(`   Frequency: ${med.frequency}`);
            doc.text(`   Duration: ${med.duration}`);
            if (med.notes) doc.text(`   Notes: ${med.notes}`);
            doc.moveDown(0.5);
        });

        if (prescription.additionalNotes) {
            doc.moveDown();
            doc.fontSize(14).text('Additional Notes:', { underline: true });
            doc.fontSize(12).text(prescription.additionalNotes);
        }

        doc.end();

        stream.on('finish', () => {
            res.download(filePath);
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    createPrescription,
    getPrescription,
    getPatientPrescriptions,
    getDoctorPrescriptions,
    updatePrescription,
    downloadPrescription
};
