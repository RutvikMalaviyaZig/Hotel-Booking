import cron from 'node-cron';

import { receiveSQSMessage } from '../helpers/SQS/receiveData';

const cronFlag = process.env.ENABLE_CRON === 'true';

export const jobs = {
    // Cron for deleting unnecessary media from db and storage
    myFirstJob: {
        schedule: '*/1 * * * *',
        start: cronFlag,
        onTick: async () => {
            try {
                await receiveSQSMessage("booking");
            } catch (error) {
                console.error('Error in myFirstJob:', error);
            }
        },
    },

}
// Initialize all cron jobs
Object.entries(jobs).forEach(([jobName, jobConfig]) => {
    if (jobConfig.start) {
        cron.schedule(jobConfig.schedule, jobConfig.onTick);
    }
});

