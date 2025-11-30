declare module "@google/genai" {
    export interface GoogleGenAIOptions {
        apiKey: string;
        baseUrl?: string;
    }

    export interface GenerateContentRequest {
        model: string;
        contents: string | Array<{ role: string, content: string }>;
        config?: {
            temperature?: number;
            maxOutputTokens?: number;
            topP?: number;
            topK?: number;
        };
    }

    export interface GenerateContentResponse {
        text: string;
        usageMetadata?: {
            promptTokenCount: number;
            candidatesTokenCount: number;
            totalTokenCount: number;
        };
    }

    export class GoogleGenAI {
        constructor(options: GoogleGenAIOptions);
        models: {
            generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse>;
            generateContentStream(request: GenerateContentRequest): AsyncIterable<GenerateContentResponse>;
        };
    }
}