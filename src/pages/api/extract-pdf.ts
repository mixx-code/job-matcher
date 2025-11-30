import type { NextApiRequest, NextApiResponse } from 'next';
import * as pdfjsLib from 'pdfjs-dist';

// Setup pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

        // Fetch PDF file
        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }

        const pdfBuffer = await response.arrayBuffer();

        if (pdfBuffer.byteLength === 0) {
            throw new Error('PDF file is empty');
        }

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        const metadata = await pdf.getMetadata();

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        // Clean text
        const cleanedText = fullText
            .replace(/\n\s*\n/g, '\n\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/([.!?])\s+/g, '$1\n')
            .replace(/[^\w\s.!?,-@\n]/g, '')
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .trim();

        res.status(200).json({
            text: cleanedText,
            pageCount: pdf.numPages,
            metadata: {
                title: metadata?.info?.Title,
                author: metadata?.info?.Author,
                subject: metadata?.info?.Subject,
                keywords: metadata?.info?.Keywords,
                creator: metadata?.info?.Creator,
                producer: metadata?.info?.Producer,
                creationDate: metadata?.info?.CreationDate,
                modificationDate: metadata?.info?.ModDate,
            },
        });
    } catch (error: any) {
        console.error('PDF extraction error:', error);
        res.status(500).json({ error: error.message });
    }
}