import { supabase } from './supabaseClient';

export interface AnalysisData {
    overallScore: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    missingSkills: string[];
    skillMatch: Record<string, number>;
    recommendations: string[];
}

export class AnalysisService {
    /**
     * Simpan hasil analisis CV ke database
     */
    static async saveCVAnalysis(
        userId: string,
        cvId: string,
        analysis: AnalysisData
    ): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('cv_analysis_results')
                .insert({
                    user_id: userId,
                    cv_id: cvId,
                    overall_score: analysis.overallScore,
                    summary: analysis.summary,
                    strengths: analysis.strengths,
                    improvements: analysis.improvements,
                    missing_skills: analysis.missingSkills,
                    skill_match: analysis.skillMatch,
                    recommendations: analysis.recommendations,
                    analysis_data: analysis, // Simpan semua data asli
                })
                .select('id')
                .single();

            if (error) throw error;
            return data.id;
        } catch (error: any) {
            console.error('Error saving CV analysis:', error);
            throw new Error(`Failed to save analysis: ${error.message}`);
        }
    }

    /**
     * Dapatkan analisis terbaru untuk user
     */
    static async getLatestAnalysis(userId: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('cv_analysis_results')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Error getting analysis:', error);
            return null;
        }
    }

    /**
     * Simpan job matches
     */
    static async saveJobMatches(
        userId: string,
        analysisId: string,
        matches: Array<{
            jobData: any;
            matchScore: number;
            matchReason: string;
            skillsMatch: string[];
        }>
    ): Promise<void> {
        try {
            const jobMatches = matches.map(match => ({
                user_id: userId,
                analysis_id: analysisId,
                job_data: match.jobData,
                match_score: match.matchScore,
                match_reason: match.matchReason,
                skills_match: match.skillsMatch,
            }));

            const { error } = await supabase
                .from('job_matches')
                .insert(jobMatches);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error saving job matches:', error);
            throw new Error(`Failed to save job matches: ${error.message}`);
        }
    }

    /**
     * Dapatkan job matches untuk user
     */
    static async getJobMatches(userId: string, analysisId?: string): Promise<any[]> {
        try {
            let query = supabase
                .from('job_matches')
                .select('*')
                .eq('user_id', userId)
                .order('match_score', { ascending: false })
                .order('created_at', { ascending: false });

            if (analysisId) {
                query = query.eq('analysis_id', analysisId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Error getting job matches:', error);
            return [];
        }
    }
}