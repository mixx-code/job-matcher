// lib/init-cron.ts
import { cronManager } from './cron-manager';

// Auto-start cron job when in production
if (process.env.NODE_ENV === 'production' && process.env.AUTO_START_CRON === 'true') {
  console.log('🚀 Auto-starting cron job in production...');
  
  cronManager.start().then(result => {
    console.log(result.message);
  });
}

// For manual import and start in other files
export const initializeCron = async () => {
  return await cronManager.start();
};