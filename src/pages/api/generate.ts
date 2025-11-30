import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, model = "gemini-2.0-flash" } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        res.status(200).json({
            text: response.text,
            model: model
        });
    } catch (error: any) {
        console.error('Google AI API error:', error);
        res.status(500).json({
            error: 'Failed to generate content',
            details: error.message
        });
    }
}