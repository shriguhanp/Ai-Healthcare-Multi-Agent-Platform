import cron from 'node-cron';
import doctorModel from './models/doctorModel.js';

// Reset doctor tokens daily at midnight (00:00)
export const scheduleDailyTokenReset = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('🔄 Running daily token reset...');

            const result = await doctorModel.updateMany(
                {},
                {
                    $set: {
                        currentTokenCount: 0,
                        lastTokenReset: Date.now()
                    }
                }
            );

            console.log(`✅ Token reset complete. Updated ${result.modifiedCount} doctors.`);
        } catch (error) {
            console.error('❌ Error resetting tokens:', error);
        }
    });

    console.log('✅ Daily token reset scheduler initialized (runs at 00:00)');
};

// Manual token reset function (can be called via API)
export const manualTokenReset = async () => {
    try {
        const result = await doctorModel.updateMany(
            {},
            {
                $set: {
                    currentTokenCount: 0,
                    lastTokenReset: Date.now()
                }
            }
        );

        return { success: true, message: `Reset ${result.modifiedCount} doctors` };
    } catch (error) {
        return { success: false, message: error.message };
    }
};
