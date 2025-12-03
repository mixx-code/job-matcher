import type { NextApiRequest, NextApiResponse } from 'next';

import { PDFParse } from "pdf-parse";

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
    extraction_metadata: any | null;
}


async function parseCVFromUrl(fileUrl: string, ext: string) {
    if (ext === ".pdf") {
        // Download file dari URL
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF dengan options untuk membaca semua halaman
        const parser = new PDFParse({
            data: buffer,
            max: 0, // No limit on pages (0 = all pages)
            pagerender: async (pageData: any) => {
                // Custom renderer untuk mendapatkan semua teks
                const renderOptions = {
                    normalizeWhitespace: false,
                    disableCombineTextItems: false
                };
                return pageData.getTextContent(renderOptions)
                    .then((textContent: any) => {
                        let text = '';
                        for (let item of textContent.items) {
                            text += item.str + ' ';
                        }
                        return text;
                    });
            }
        });

        const result = await parser.getText();
        console.log(`PDF parse result:`, {
            hasText: !!result.text,
            textLength: result.text?.length || 0,
            numpages: result.numpages,
            info: result.info
        });

        return result.text || '';
    }

    throw new Error("Unsupported file format. Only PDF is supported.");
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileUrl } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: 'File URL is required' });
        }

        // Validasi URL
        try {
            new URL(fileUrl);
        } catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Cek ekstensi file
        const urlPath = new URL(fileUrl).pathname.toLowerCase();
        const ext = urlPath.endsWith('.pdf') ? '.pdf' : null;

        if (!ext) {
            return res.status(400).json({ error: 'Only PDF files are supported' });
        }

        console.log(`Processing PDF from URL: ${fileUrl}`);

        // Parse CV dari URL
        const text = await parseCVFromUrl(fileUrl, ext);

        if (!text || text.trim().length === 0) {
            throw new Error('No text extracted from PDF');
        }

        // console.log(`Extracted text: ${text}`);

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
        // console.log(`Cleaned text: ${cleanedText}`);

        res.status(200).json({
            success: true,
            text: cleanedText,
            fileType: ext,
            stats: {
                originalLength: text.length,
                cleanedLength: cleanedText.length
            }
        });

    } catch (error: any) {
        console.error('Error:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Failed to extract text from PDF'
        });
    }
} 