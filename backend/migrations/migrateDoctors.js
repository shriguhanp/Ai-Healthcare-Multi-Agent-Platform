/**
 * Database Migration Script
 * Run this to add new fields to existing Doctor documents
 * 
 * Usage: node migrations/migrateDoctors.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import doctorModel from '../models/doctorModel.js';

dotenv.config();

const migrateDoctors = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🔄 Starting doctor migration...');

        // Update all doctors that don't have the new fields
        const result = await doctorModel.updateMany(
            {
                $or: [
                    { location: { $exists: false } },
                    { tokenLimit: { $exists: false } },
                    { currentTokenCount: { $exists: false } },
                    { availabilityStatus: { $exists: false } },
                    { rating: { $exists: false } }
                ]
            },
            {
                $set: {
                    hospitalId: null,
                    hospitalName: '',
                    location: {
                        city: '',
                        area: '',
                        pincode: '',
                        coordinates: { lat: 0, lng: 0 }
                    },
                    tokenLimit: 30,
                    currentTokenCount: 0,
                    availabilityStatus: 'Available',
                    lastTokenReset: Date.now(),
                    rating: 0,
                    totalRatings: 0
                }
            }
        );

        console.log(`✅ Migration complete! Updated ${result.modifiedCount} doctors.`);

        // Verify update
        const updatedDoctors = await doctorModel.find({});
        console.log(`\n📊 Total doctors in database: ${updatedDoctors.length}`);
        console.log('Sample doctor fields:', updatedDoctors[0] ? Object.keys(updatedDoctors[0]._doc) : 'No doctors found');

        mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        mongoose.connection.close();
        process.exit(1);
    }
};

// Run migration
migrateDoctors();
