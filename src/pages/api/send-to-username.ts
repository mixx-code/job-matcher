// pages/api/send-to-username.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, message } = req.body;

    if (!username || !message) {
        return res.status(400).json({
            error: 'Username and message are required'
        });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    try {
        // 1. Kirim pesan langsung ke username
        const response = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                chat_id: `@${username.replace('@', '')}`, // Format: @username
                text: message,
                parse_mode: 'HTML'
            }
        );

        return res.status(200).json({
            success: true,
            data: response.data
        });

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);

        // Jika error karena chat not found, coba dapatkan chat_id dulu
        if (error.response?.data?.description?.includes('chat not found')) {
            return res.status(404).json({
                success: false,
                error: 'User/Channel not found or bot not added',
                note: 'Bot mungkin perlu di-add ke channel/grup terlebih dahulu'
            });
        }

        return res.status(500).json({
            success: false,
            error: error.response?.data?.description || error.message
        });
    }
}