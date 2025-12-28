// src\pages\api\extract-pdf.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    externalResolver: true,
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
  requiresManualExtraction?: boolean;
}

async function parseCVFromUrl(fileUrl: string, ext: string): Promise<string> {
  if (ext === ".pdf") {
    try {
      // Download file dari URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // COBA METODE 1: Import langsung (bekerja di local)
      try {
        // Dynamic import untuk menghindari error di build time
        const pdfParseModule = await import('pdf-parse');
        
        // Coba akses dengan berbagai cara karena struktur export bisa berbeda
        let pdfParse;
        if (typeof pdfParseModule === 'function') {
          pdfParse = pdfParseModule;
        } else if (pdfParseModule.default) {
          pdfParse = pdfParseModule.default;
        } else if (pdfParseModule.PDFParse) {
          // Jika menggunakan named export PDFParse
          pdfParse = pdfParseModule.PDFParse;
        } else {
          throw new Error('Cannot find PDF parse function');
        }
        
        // Parse PDF
        const result = await pdfParse(buffer);
        
        console.log(`PDF parse result (dynamic import):`, {
          hasText: !!result?.text,
          textLength: result?.text?.length || 0,
        });

        return result?.text || '';
        
      } catch (dynamicImportError) {
        console.log('Dynamic import failed, trying direct method...', dynamicImportError);
        
        // COBA METODE 2: Direct import (bekerja di local)
        try {
          // Direct import untuk local development
          const { PDFParse } = require('pdf-parse');
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          
          console.log(`PDF parse result (direct):`, {
            hasText: !!result?.text,
            textLength: result?.text?.length || 0,
          });
          
          return result?.text || '';
        } catch (directImportError) {
          console.log('Direct import also failed:', directImportError);
          throw new Error('Both PDF parsing methods failed');
        }
      }
      
    } catch (pdfError) {
      console.error('PDF parse error:', pdfError);
      throw new Error(`PDF parsing failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }
  }

  throw new Error("Unsupported file format. Only PDF is supported.");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParseResponse>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { fileUrl, fallbackText } = req.body;

    // OPTION 1: Jika user sudah memberikan text yang sudah diekstrak
    if (fallbackText && typeof fallbackText === 'string') {
      console.log('Using fallback text provided by user');
      
      const cleanedText = fallbackText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      return res.status(200).json({
        success: true,
        text: cleanedText,
        fileType: 'text',
        stats: {
          originalLength: fallbackText.length,
          cleanedLength: cleanedText.length
        }
      });
    }

    // OPTION 2: Coba parse dari URL PDF
    if (!fileUrl) {
      return res.status(400).json({ 
        success: false,
        error: 'File URL or fallback text is required' 
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
      return res.status(400).json({
        success: false,
        error: 'No text extracted from PDF. The PDF might be scanned or image-based.',
        requiresManualExtraction: true,
        details: 'Please extract text manually: Open PDF → Select All (Ctrl+A) → Copy (Ctrl+C) → Paste here'
      });
    }

    console.log(`Extracted text length: ${text.length} characters`);

    // Basic cleaning
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    console.log(`Cleaned text length: ${cleanedText.length} characters`);

    return res.status(200).json({
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
    
    console.error('Error in extract-pdf API:', errorMessage);
    
    // Berikan pesan error yang lebih spesifik
    let userError = errorMessage;
    let statusCode = 500;
    let requiresManualExtraction = false;
    
    if (errorMessage.includes('DOMMatrix') || 
        errorMessage.includes('canvas') || 
        errorMessage.includes('ReferenceError') ||
        errorMessage.includes('PDF parsing failed')) {
      userError = 'PDF parsing service is not available. Please extract text manually and use the text input below.';
      requiresManualExtraction = true;
      statusCode = 503; // Service Unavailable
    } else if (errorMessage.includes('Failed to download')) {
      statusCode = 400;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: userError,
      details: 'Please extract text manually from your PDF',
      requiresManualExtraction
    });
  }
}