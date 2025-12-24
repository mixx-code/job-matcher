import type { NextApiRequest, NextApiResponse } from 'next';
import { PDFParse } from 'pdf-parse';

interface UserCV {
    user_id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    created_at: string;
    updated_at: string;
    extracted_text: string | null;
    extraction_metadata: Record<string, unknown> | null;
}

interface PDFParseResult {
    text: string;
    numpages?: number;
    numrender?: number;
    info?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    version?: string;
}

interface TextContentItem {
    str: string;
    dir?: string;
    width?: number;
    height?: number;
    transform?: number[];
    fontName?: string;
}

interface TextContent {
    items: TextContentItem[];
}

interface PageData {
    getTextContent: (options?: {
        normalizeWhitespace?: boolean;
        disableCombineTextItems?: boolean;
    }) => Promise<TextContent>;
}

interface ParseResponse {
    success: boolean;
    text?: string;
    fileType?: string;
    stats?: {
        originalLength: number;
        cleanedLength: number;
    };
    error?: string;
    details?: string;
}

async function parseCVFromUrl(fileUrl: string, ext: string): Promise<string> {
    if (ext === ".pdf") {
        // Download file dari URL
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF - gunakan PDFParse dengan hanya data buffer
        // Karena pagerender tidak ada di LoadParameters, kita gunakan default parsing
        const parser = new PDFParse({ data: buffer });
        
        const result = await parser.getText() as PDFParseResult;
        
        console.log(`PDF parse result:`, {
            hasText: !!result.text,
            textLength: result.text?.length || 0,
            numpages: result.numpages || 'unknown',
            hasInfo: !!result.info
        });

        return result.text || '';
    }

    throw new Error("Unsupported file format. Only PDF is supported.");
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ParseResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }

    try {
        const { fileUrl } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ 
                success: false,
                error: 'File URL is required' 
            });
        }

        // Validasi URL
        try {
            new URL(fileUrl);
        } catch {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid URL format' 
            });
        }

        // Cek ekstensi file
        const urlPath = new URL(fileUrl).pathname.toLowerCase();
        const ext = urlPath.endsWith('.pdf') ? '.pdf' : null;

        if (!ext) {
            return res.status(400).json({ 
                success: false,
                error: 'Only PDF files are supported' 
            });
        }

        console.log(`Processing PDF from URL: ${fileUrl}`);

        // Parse CV dari URL
        const text = await parseCVFromUrl(fileUrl, ext);

        if (!text || text.trim().length === 0) {
            throw new Error('No text extracted from PDF');
        }

        console.log(`Extracted text length: ${text.length} characters`);

        // Basic cleaning dengan lebih banyak normalisasi
        const cleanedText = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

        console.log(`Cleaned text length: ${cleanedText.length} characters`);

        res.status(200).json({
            success: true,
            text: cleanedText,
            fileType: ext,
            stats: {
                originalLength: text.length,
                cleanedLength: cleanedText.length
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        console.error('Error:', errorMessage);
        if (errorStack) {
            console.error('Error stack:', errorStack);
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            details: 'Failed to extract text from PDF'
        });
    }
}