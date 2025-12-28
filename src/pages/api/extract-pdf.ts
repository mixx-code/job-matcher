// src/pages/api/extract-pdf.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export const dynamic = 'force-dynamic';

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

async function parsePDFFromUrl(fileUrl: string): Promise<string> {
    // Import pdfjs-dist dengan path yang benar
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker dari CDN atau local
    if (typeof window === 'undefined') {
        // Server-side: disable worker untuk serverless
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }

    // Download file
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Load PDF dengan opsi yang kompatibel dengan serverless
    const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
        isEvalSupported: false,
        useWorkerFetch: false,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    console.log(`PDF has ${numPages} pages`);

    let fullText = '';

    // Extract text dari setiap halaman
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map((item) => {
                // Type guard untuk TextItem
                if ('str' in item) {
                    return item.str;
                }
                return '';
            })
            .join(' ');

        fullText += pageText + '\n\n';
    }

    return fullText;
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
        if (!urlPath.endsWith('.pdf')) {
            return res.status(400).json({
                success: false,
                error: 'Only PDF files are supported'
            });
        }

        console.log(`Processing PDF from URL: ${fileUrl}`);

        // Parse PDF
        const text = await parsePDFFromUrl(fileUrl);

        if (!text || text.trim().length === 0) {
            throw new Error('No text extracted from PDF');
        }

        console.log(`Extracted text length: ${text.length} characters`);

        // Clean text
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
            fileType: '.pdf',
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