// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8569654353:AAFn7Ja4mgFIwHfKQDWqopiEthBj44cY-1E';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    console.log('=== TELEGRAM WEBHOOK RECEIVED ===');
    console.log('Time:', new Date().toLocaleString());
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body type:', typeof req.body);
    console.log('Body length:', req.body?.length || 0);

    // Log raw body pertama
    console.log('Raw body (first 500 chars):',
        typeof req.body === 'string' ? req.body.substring(0, 500) :
            JSON.stringify(req.body).substring(0, 500));

    if (req.method !== 'POST') {
        console.log('❌ Wrong method, returning 405');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let update;
    try {
        // Coba parse body
        if (typeof req.body === 'string') {
            update = JSON.parse(req.body);
        } else if (typeof req.body === 'object') {
            update = req.body;
        } else {
            console.log('❌ Unknown body type');
            return res.status(400).json({ error: 'Invalid body format' });
        }

        console.log('✅ Parsed update:', JSON.stringify(update, null, 2));

    } catch (parseError) {
        console.error('❌ JSON Parse error:', parseError);
        console.log('Raw body that failed:', req.body);
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Cek struktur data Telegram
    if (!update) {
        console.log('❌ Update is null/undefined');
        return res.status(200).json({ ok: true, note: 'Empty update' });
    }

    // Handle berdasarkan tipe update
    if (update.message) {
        await handleMessage(update.message);
    } else if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
    } else if (update.edited_message) {
        console.log('✏️ Edited message:', update.edited_message);
    } else {
        console.log('📦 Unknown update type:', Object.keys(update));
    }

    // Selalu return ok untuk Telegram
    console.log('✅ Returning ok to Telegram');
    return res.status(200).json({ ok: true });
}

// Handle message
async function handleMessage(message: any) {
    console.log('💌 Processing message...');

    const chatId = message.chat.id;
    const text = message.text || '';
    const username = message.from.username || 'no_username';
    const firstName = message.from.first_name || 'User';

    console.log(`📨 From: ${firstName} (@${username}, ID: ${chatId})`);
    console.log(`💬 Text: "${text}"`);

    // Simple echo untuk testing
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: `I received: "${text}"\n\nYour ID: \`${chatId}\`\nUsername: @${username}`,
            parse_mode: 'Markdown'
        });
        console.log(`✅ Echo sent to ${chatId}`);
    } catch (error: any) {
        console.error('❌ Failed to send echo:', error.response?.data || error.message);
    }
}

// Handle callback query
async function handleCallbackQuery(callbackQuery: any) {
    console.log('🔄 Processing callback query...');
    console.log('Data:', callbackQuery.data);
    // Implementasi callback handling
}