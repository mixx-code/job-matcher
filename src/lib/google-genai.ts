import { GoogleGenAI } from "@google/genai";

// Initialize dengan API key dari environment variable
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});

export async function generateContent(prompt: string, model: string = "gemini-2.0-flash") {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error('Error generating content:', error);
        throw new Error('Failed to generate content');
    }
}

export async function generateContentStream(prompt: string, model: string = "gemini-2.0-flash") {
    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
        });

        return response;
    } catch (error) {
        console.error('Error generating stream:', error);
        throw new Error('Failed to generate stream');
    }
}