// scripts/setup-webhook-fixed.ts
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from multiple possible locations
const envPaths = [
    '.env.local',
    '.env',
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`✅ Loaded env from: ${envPath}`);
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.log('⚠️  No .env file found, using hardcoded token');
}

// Use token from env or hardcode for testing
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8569654353:AAFn7Ja4mgFIwHfKQDWqopiEthBj44cY-1E';
const WEBHOOK_URL = 'https://7891ad45d2ac.ngrok-free.app/api/webhook';

async function setupWebhook() {
    console.log('🔄 Telegram Webhook Setup');
    console.log('========================');
    console.log(`Bot Token: ${BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'NOT FOUND'}`);
    console.log(`Webhook URL: ${WEBHOOK_URL}`);

    if (!BOT_TOKEN || BOT_TOKEN.includes('undefined')) {
        console.error('\n❌ ERROR: Bot token is undefined or invalid!');
        console.log('💡 Solution: Create .env.local file with:');
        console.log('TELEGRAM_BOT_TOKEN=8569654353:AAFn7Ja4mgFIwHfKQDWqopiEthBj44cY-1E');
        return;
    }

    try {
        // 1. First, test if bot token is valid
        console.log('\n1. Testing bot token...');
        const meResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        console.log(`✅ Bot: @${meResponse.data.result.username} (${meResponse.data.result.first_name})`);

        // 2. Delete existing webhook
        console.log('\n2. Deleting old webhook...');
        const deleteResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
        console.log(`✅ Delete: ${JSON.stringify(deleteResponse.data)}`);

        // 3. Set new webhook
        console.log('\n3. Setting new webhook...');
        const setResponse = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
            {
                url: WEBHOOK_URL,
                allowed_updates: ['message', 'callback_query'],
                drop_pending_updates: true
            }
        );
        console.log(`✅ Set webhook: ${JSON.stringify(setResponse.data)}`);

        // 4. Get webhook info
        console.log('\n4. Getting webhook info...');
        const infoResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        const info = infoResponse.data.result;

        console.log('📋 Webhook Information:');
        console.log(`   URL: ${info.url}`);
        console.log(`   Has custom certificate: ${info.has_custom_certificate}`);
        console.log(`   Pending update count: ${info.pending_update_count}`);
        console.log(`   Last error date: ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : 'None'}`);
        console.log(`   Last error message: ${info.last_error_message || 'None'}`);

        console.log('\n🎉 Webhook setup completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Start your Next.js server: npm run dev');
        console.log('2. Make sure it\'s running on http://localhost:3000');
        console.log('3. Open Telegram and send /start to your bot');
        console.log('4. Check server logs for incoming webhook data');

    } catch (error: any) {
        console.error('\n❌ Setup failed:');

        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Error: ${error.response.data.description || JSON.stringify(error.response.data)}`);

            if (error.response.status === 404) {
                console.error('\n💡 Possible causes:');
                console.error('1. Bot token is incorrect');
                console.error('2. Bot has been deleted from @BotFather');
                console.error('3. Token format is wrong (should be: 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ)');
            }
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
}

// Run setup
setupWebhook();