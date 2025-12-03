import { supabase } from './supabaseClient';

export interface AnalysisData {
    overallScore: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    missingSkills: string[];
    skillMatch: Record<string, number>;
    recommendations: string[];
    personalInfo?: {
        name?: string | null;
        location?: string | null;
        email?: string | null;
        phone?: string | null;
    };
    professionalSummary?: {
        field?: string;
        experienceLevel?: string;
        keyExpertise?: string[];
    };
    missingElements?: string[];
}

export class AnalysisService {
    /**
     * Validasi dan cleanup data analisis sebelum disimpan
     */
    private static validateAnalysisData(analysis: AnalysisData): AnalysisData {
        const validatedData = {
            overallScore: analysis.overallScore || 0,
            summary: analysis.summary || 'Tidak ada summary tersedia',
            strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter(s => s != null) : [],
            improvements: Array.isArray(analysis.improvements) ? analysis.improvements.filter(i => i != null) : [],
            missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills.filter(s => s != null) : [],
            skillMatch: analysis.skillMatch || {},
            recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.filter(r => r != null) : [],
            personalInfo: analysis.personalInfo || {},
            professionalSummary: analysis.professionalSummary || {},
            missingElements: Array.isArray(analysis.missingElements) ? analysis.missingElements.filter(e => e != null) : []
        };

        console.log('🔍 Data setelah validasi:', {
            missingSkills: validatedData.missingSkills,
            missingSkillsCount: validatedData.missingSkills.length,
            missingElements: validatedData.missingElements,
            personalInfo: validatedData.personalInfo
        });

        return validatedData;
    }

    /**
     * Simpan hasil analisis CV ke database
     */
    static async saveCVAnalysis(
        userId: string,
        cvId: string,
        analysis: AnalysisData
    ): Promise<string> {
        try {
            // Validasi data sebelum disimpan
            const validatedAnalysis = this.validateAnalysisData(analysis);

            console.log('💾 Menyimpan analisis ke database:', {
                userId,
                cvId,
                missingSkillsCount: validatedAnalysis.missingSkills.length,
                missingElementsCount: validatedAnalysis.missingElements.length,
                overallScore: validatedAnalysis.overallScore
            });

            // Data untuk insert - SESUAI SCHEMA YANG DIPERBARUI
            const insertData = {
                user_id: userId,
                cv_id: cvId,
                overall_score: validatedAnalysis.overallScore,
                summary: validatedAnalysis.summary,
                strengths: validatedAnalysis.strengths,
                improvements: validatedAnalysis.improvements,
                missing_skills: validatedAnalysis.missingSkills,
                skill_match: validatedAnalysis.skillMatch,
                recommendations: validatedAnalysis.recommendations,
                analysis_data: validatedAnalysis, // Simpan semua data asli
                personal_info: validatedAnalysis.personalInfo,
                professional_summary: validatedAnalysis.professionalSummary,
                missing_elements: validatedAnalysis.missingElements
            };

            console.log('📤 Data yang akan disimpan:', {
                missing_skills: insertData.missing_skills,
                missing_skills_length: insertData.missing_skills.length,
                missing_elements: insertData.missing_elements,
                personal_info: insertData.personal_info
            });

            const { data, error } = await supabase
                .from('cv_analysis_results')
                .insert(insertData)
                .select('id')
                .single();

            if (error) {
                console.error('❌ Database error:', error);
                console.error('❌ Error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }

            console.log('✅ Analisis berhasil disimpan dengan ID:', data.id);
            return data.id;

        } catch (error: any) {
            console.error('❌ Error saving CV analysis:', error);
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

            // Format data response
            if (data) {
                return {
                    id: data.id,
                    overallScore: data.overall_score,
                    summary: data.summary,
                    strengths: data.strengths,
                    improvements: data.improvements,
                    missingSkills: data.missing_skills,
                    skillMatch: data.skill_match,
                    recommendations: data.recommendations,
                    personalInfo: data.personal_info,
                    professionalSummary: data.professional_summary,
                    missingElements: data.missing_elements,
                    analysisData: data.analysis_data,
                    createdAt: data.created_at
                };
            }

            return null;
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
                skills_match: Array.isArray(match.skillsMatch) ? match.skillsMatch : [],
            }));

            const { error } = await supabase
                .from('job_matches')
                .insert(jobMatches);

            if (error) throw error;

            console.log('✅ Job matches berhasil disimpan:', jobMatches.length, 'jobs');
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

    /**
     * Dapatkan semua analisis untuk user
     */
    static async getUserAnalyses(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('cv_analysis_results')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format response data
            return (data || []).map(item => ({
                id: item.id,
                overallScore: item.overall_score,
                summary: item.summary,
                strengths: item.strengths,
                improvements: item.improvements,
                missingSkills: item.missing_skills,
                skillMatch: item.skill_match,
                recommendations: item.recommendations,
                personalInfo: item.personal_info,
                professionalSummary: item.professional_summary,
                missingElements: item.missing_elements,
                analysisData: item.analysis_data,
                createdAt: item.created_at,
                fileName: item.file_name
            }));
        } catch (error: any) {
            console.error('Error getting user analyses:', error);
            return [];
        }
    }

    /**
     * Hapus analisis berdasarkan ID
     */
    static async deleteAnalysis(analysisId: string): Promise<void> {
        try {
            // Hapus job matches terlebih dahulu
            const { error: jobMatchesError } = await supabase
                .from('job_matches')
                .delete()
                .eq('analysis_id', analysisId);

            if (jobMatchesError) {
                console.warn('Warning deleting job matches:', jobMatchesError);
            }

            // Hapus analisis
            const { error } = await supabase
                .from('cv_analysis_results')
                .delete()
                .eq('id', analysisId);

            if (error) throw error;

            console.log('✅ Analisis berhasil dihapus:', analysisId);
        } catch (error: any) {
            console.error('Error deleting analysis:', error);
            throw new Error(`Failed to delete analysis: ${error.message}`);
        }
    }

    /**
     * Update analysis dengan data tambahan
     */
    static async updateAnalysis(analysisId: string, updates: Partial<AnalysisData>): Promise<void> {
        try {
            const updateData: any = {};

            if (updates.overallScore !== undefined) {
                updateData.overall_score = updates.overallScore;
            }
            if (updates.summary !== undefined) {
                updateData.summary = updates.summary;
            }
            if (updates.strengths !== undefined) {
                updateData.strengths = updates.strengths;
            }
            if (updates.improvements !== undefined) {
                updateData.improvements = updates.improvements;
            }
            if (updates.missingSkills !== undefined) {
                updateData.missing_skills = updates.missingSkills;
            }
            if (updates.skillMatch !== undefined) {
                updateData.skill_match = updates.skillMatch;
            }
            if (updates.recommendations !== undefined) {
                updateData.recommendations = updates.recommendations;
            }
            if (updates.personalInfo !== undefined) {
                updateData.personal_info = updates.personalInfo;
            }
            if (updates.professionalSummary !== undefined) {
                updateData.professional_summary = updates.professionalSummary;
            }
            if (updates.missingElements !== undefined) {
                updateData.missing_elements = updates.missingElements;
            }

            const { error } = await supabase
                .from('cv_analysis_results')
                .update(updateData)
                .eq('id', analysisId);

            if (error) throw error;

            console.log('✅ Analisis berhasil diupdate:', analysisId);
        } catch (error: any) {
            console.error('Error updating analysis:', error);
            throw new Error(`Failed to update analysis: ${error.message}`);
        }
    }
}

// import { supabase } from './supabaseClient';

// export interface AnalysisData {
//     overallScore: number;
//     summary: string;
//     strengths: string[];
//     improvements: string[];
//     missingSkills: string[];
//     skillMatch: Record<string, number>;
//     recommendations: string[];
// }

// export class AnalysisService {
//     /**
//      * Simpan hasil analisis CV ke database
//      */
//     static async saveCVAnalysis(
//         userId: string,
//         cvId: string,
//         analysis: AnalysisData
//     ): Promise<string> {
//         try {
//             const { data, error } = await supabase
//                 .from('cv_analysis_results')
//                 .insert({
//                     user_id: userId,
//                     cv_id: cvId,
//                     overall_score: analysis.overallScore,
//                     summary: analysis.summary,
//                     strengths: analysis.strengths,
//                     improvements: analysis.improvements,
//                     missing_skills: analysis.missingSkills,
//                     skill_match: analysis.skillMatch,
//                     recommendations: analysis.recommendations,
//                     analysis_data: analysis, // Simpan semua data asli
//                 })
//                 .select('id')
//                 .single();

//             if (error) throw error;
//             return data.id;
//         } catch (error: any) {
//             console.error('Error saving CV analysis:', error);
//             throw new Error(`Failed to save analysis: ${error.message}`);
//         }
//     }

//     /**
//      * Dapatkan analisis terbaru untuk user
//      */
//     static async getLatestAnalysis(userId: string): Promise<any> {
//         try {
//             const { data, error } = await supabase
//                 .from('cv_analysis_results')
//                 .select('*')
//                 .eq('user_id', userId)
//                 .order('created_at', { ascending: false })
//                 .limit(1)
//                 .single();

//             if (error) throw error;
//             return data;
//         } catch (error: any) {
//             console.error('Error getting analysis:', error);
//             return null;
//         }
//     }

//     /**
//      * Simpan job matches
//      */
//     static async saveJobMatches(
//         userId: string,
//         analysisId: string,
//         matches: Array<{
//             jobData: any;
//             matchScore: number;
//             matchReason: string;
//             skillsMatch: string[];
//         }>
//     ): Promise<void> {
//         try {
//             const jobMatches = matches.map(match => ({
//                 user_id: userId,
//                 analysis_id: analysisId,
//                 job_data: match.jobData,
//                 match_score: match.matchScore,
//                 match_reason: match.matchReason,
//                 skills_match: match.skillsMatch,
//             }));

//             const { error } = await supabase
//                 .from('job_matches')
//                 .insert(jobMatches);

//             if (error) throw error;
//         } catch (error: any) {
//             console.error('Error saving job matches:', error);
//             throw new Error(`Failed to save job matches: ${error.message}`);
//         }
//     }

//     /**
//      * Dapatkan job matches untuk user
//      */
//     static async getJobMatches(userId: string, analysisId?: string): Promise<any[]> {
//         try {
//             let query = supabase
//                 .from('job_matches')
//                 .select('*')
//                 .eq('user_id', userId)
//                 .order('match_score', { ascending: false })
//                 .order('created_at', { ascending: false });

//             if (analysisId) {
//                 query = query.eq('analysis_id', analysisId);
//             }

//             const { data, error } = await query;

//             if (error) throw error;
//             return data || [];
//         } catch (error: any) {
//             console.error('Error getting job matches:', error);
//             return [];
//         }
//     }
// }