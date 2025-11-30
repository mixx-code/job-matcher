import { supabase } from './supabaseClient';

export interface ExtractedText {
    text: string;
    pageCount: number;
    metadata: {
        title?: string;
        author?: string;
    };
}

export class CVTextExtractor {
    /**
     * Simple text extraction - just returns basic info without actual PDF parsing
     */
    static async extractUserCV(userId: string): Promise<ExtractedText> {
        try {
            console.log(`Getting CV info for user: ${userId}`);

            // Get user's CV data from database
            const { data: cvData, error } = await supabase
                .from('user_cvs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !cvData) {
                throw new Error('No CV found for user');
            }

            // Return basic info without actual PDF extraction
            return {
                text: `CV File: ${cvData.file_name}\n\nFor detailed AI analysis, please use the analysis feature with the uploaded file. Automatic text extraction is currently being improved.`,
                pageCount: 1,
                metadata: {
                    title: cvData.file_name,
                    author: 'User',
                },
            };
        } catch (error: any) {
            console.error('CV extraction error:', error);
            throw new Error(`CV processing failed: ${error.message}`);
        }
    }

    /**
     * Extract and format CV text for AI analysis
     */
    static async extractCVForAnalysis(userId: string): Promise<string> {
        try {
            const extracted = await this.extractUserCV(userId);

            return this.formatForAnalysis(extracted.text, extracted.metadata, extracted.pageCount);
        } catch (error: any) {
            throw new Error(`CV analysis preparation failed: ${error.message}`);
        }
    }

    private static formatForAnalysis(text: string, metadata: any, pageCount: number): string {
        const analysisText = `
CV ANALYSIS READY

DOCUMENT INFO:
- File: ${metadata.title || 'CV Document'}
- Pages: ${pageCount}

CONTENT PREVIEW:
${text}

NOTE: For best results, ensure your CV text is properly formatted and includes relevant skills and experience.
    `.trim();

        return analysisText;
    }

    /**
     * Quick check if user has a CV
     */
    static async hasExtractableCV(userId: string): Promise<boolean> {
        try {
            const { data: cvData } = await supabase
                .from('user_cvs')
                .select('file_url')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            return !!cvData;
        } catch {
            return false;
        }
    }
}