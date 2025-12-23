// import { useState, useCallback } from 'react';
// import { PDFJSExtractor, ExtractedText } from '../lib/pdfJSExtractor';
// import { CVTextExtractor } from '../lib/cv-text-extractor';

// export const usePDFExtraction = () => {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [extractedText, setExtractedText] = useState<ExtractedText | null>(null);

//     const extractFromUrl = useCallback(async (fileUrl: string) => {
//         setLoading(true);
//         setError(null);

//         try {
//             // Validate it's a PDF first
//             const isValidPDF = await PDFJSExtractor.validatePDF(fileUrl);
//             if (!isValidPDF) {
//                 throw new Error('File is not a valid PDF');
//             }

//             const result = await PDFJSExtractor.extractTextFromSupabase(fileUrl);
//             setExtractedText(result);
//             return result;
//         } catch (err: any) {
//             const errorMessage = err.message || 'Extraction failed';
//             setError(errorMessage);
//             throw err;
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     const extractUserCV = useCallback(async (userId: string) => {
//         setLoading(true);
//         setError(null);

//         try {
//             const result = await CVTextExtractor.extractUserCV(userId);
//             setExtractedText(result);
//             return result;
//         } catch (err: any) {
//             const errorMessage = err.message || 'CV extraction failed';
//             setError(errorMessage);
//             throw err;
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     const extractForAnalysis = useCallback(async (userId: string): Promise<string> => {
//         setLoading(true);
//         setError(null);

//         try {
//             const result = await CVTextExtractor.extractCVForAnalysis(userId);
//             return result;
//         } catch (err: any) {
//             const errorMessage = err.message || 'Analysis extraction failed';
//             setError(errorMessage);
//             throw err;
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     const reset = useCallback(() => {
//         setExtractedText(null);
//         setError(null);
//         setLoading(false);
//     }, []);

//     return {
//         loading,
//         error,
//         extractedText,
//         extractFromUrl,
//         extractUserCV,
//         extractForAnalysis,
//         reset,
//     };
// };