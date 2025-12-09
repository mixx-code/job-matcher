import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});

let apiCallCount = 0;

export async function generateContent(prompt: string, model: string = "gemini-2.5-flash-lite") {
    try {
        apiCallCount++;
        console.log(`📊 API Call #${apiCallCount}`);

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text;
    } catch (error: any) {
        console.error('❌ Error:', error.message);

        // Cek kalo limit abis
        if (error.message?.includes('quota') ||
            error.message?.includes('limit') ||
            error.message?.includes('429')) {
            console.error('🚨 LIMIT API ABIS BRO!');
            console.error('🚨 Cek Google Cloud Console lu!');
        }

        throw error;
    }
}

export async function generateContentStream(prompt: string, model: string = "gemini-2.0-flash") {
    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
        });
        return response;
    } catch (error: any) {
        console.error('❌ Stream Error:', error.message);
        throw error;
    }
}