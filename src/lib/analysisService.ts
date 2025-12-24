
// import { supabase } from './supabaseClient';
// import { Database } from '../types/supabase'; // Import type dari supabase.ts
// import { PostgrestError } from '@supabase/supabase-js'; // Import type error Supabase

// type Tables = Database['public']['Tables'];
// type CVAnalysisResultsRow = Tables['cv_analysis_results']['Row'];
// type CVAnalysisResultsInsert = Tables['cv_analysis_results']['Insert'];
// type CVAnalysisResultsUpdate = Tables['cv_analysis_results']['Update'];
// type JobMatchesRow = Tables['job_matches']['Row'];
// type JobMatchesInsert = Tables['job_matches']['Insert'];

// export interface AnalysisData {
//     overallScore: number;
//     summary: string;
//     strengths: string[];
//     improvements: string[];
//     missingSkills: string[];
//     skillMatch: Record<string, number>;
//     recommendations: string[];
//     personalInfo?: {
//         name?: string | null;
//         location?: string | null;
//         email?: string | null;
//         phone?: string | null;
//     };
//     professionalSummary?: {
//         field?: string;
//         experienceLevel?: string;
//         keyExpertise?: string[];
//     };
//     missingElements?: string[];
// }

// // Type untuk custom error
// interface AnalysisError extends Error {
//     details?: string;
//     hint?: string;
//     code?: string;
// }

// export class AnalysisService {
//     /**
//      * Validasi dan cleanup data analisis sebelum disimpan
//      */
//     private static validateAnalysisData(analysis: AnalysisData): AnalysisData {
//         const validatedData = {
//             overallScore: analysis.overallScore || 0,
//             summary: analysis.summary || 'Tidak ada summary tersedia',
//             strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter(s => s != null) : [],
//             improvements: Array.isArray(analysis.improvements) ? analysis.improvements.filter(i => i != null) : [],
//             missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills.filter(s => s != null) : [],
//             skillMatch: analysis.skillMatch || {},
//             recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.filter(r => r != null) : [],
//             personalInfo: analysis.personalInfo || {},
//             professionalSummary: analysis.professionalSummary || {},
//             missingElements: Array.isArray(analysis.missingElements) ? analysis.missingElements.filter(e => e != null) : []
//         };

//         console.log('🔍 Data setelah validasi:', {
//             missingSkills: validatedData.missingSkills,
//             missingSkillsCount: validatedData.missingSkills.length,
//             missingElements: validatedData.missingElements,
//             personalInfo: validatedData.personalInfo
//         });

//         return validatedData;
//     }

//     /**
//      * Simpan hasil analisis CV ke database
//      */
//     static async saveCVAnalysis(
//         userId: string,
//         cvId: string,
//         analysis: AnalysisData
//     ): Promise<string> {
//         try {
//             // Validasi data sebelum disimpan
//             const validatedAnalysis = this.validateAnalysisData(analysis);


//             // Data untuk insert - SESUAI SCHEMA YANG DIPERBARUI
//             const insertData: CVAnalysisResultsInsert = {
//                 user_id: userId,
//                 cv_id: cvId,
//                 overall_score: validatedAnalysis.overallScore,
//                 summary: validatedAnalysis.summary,
//                 strengths: validatedAnalysis.strengths,
//                 improvements: validatedAnalysis.improvements,
//                 missing_skills: validatedAnalysis.missingSkills,
//                 skill_match: validatedAnalysis.skillMatch,
//                 recommendations: validatedAnalysis.recommendations,
//                 analysis_data: validatedAnalysis.,
//                 personal_info: validatedAnalysis.personalInfo,
//                 professional_summary: validatedAnalysis.professionalSummary,
//                 missing_elements: validatedAnalysis.missingElements
//             };

//             console.log('📤 Data yang akan disimpan:', {
//                 missing_skills: insertData.missing_skills,
//                 missing_elements: insertData.missing_elements,
//                 personal_info: insertData.personal_info
//             });

//             const { data, error } = await supabase
//                 .from('cv_analysis_results')
//                 .insert(insertData)
//                 .select('id')
//                 .single();

//             if (error) {
//                 console.error('❌ Database error:', error);
//                 console.error('❌ Error details:', {
//                     message: error.message,
//                     details: error.details,
//                     hint: error.hint
//                 });
//                 throw error;
//             }

//             if (!data) {
//                 throw new Error('No data returned from insert operation');
//             }

//             console.log('✅ Analisis berhasil disimpan dengan ID:', data.id);
//             return data.id;

//         } catch (error: unknown) {
//             console.error('❌ Error saving CV analysis:', error);

//             // Handle different error types
//             let errorMessage = 'Failed to save analysis';

//             if (error instanceof Error) {
//                 errorMessage = `${errorMessage}: ${error.message}`;
//             } else if (typeof error === 'object' && error !== null && 'message' in error) {
//                 errorMessage = `${errorMessage}: ${String((error as any).message)}`;
//             } else {
//                 errorMessage = `${errorMessage}: Unknown error occurred`;
//             }

//             throw new Error(errorMessage);
//         }
//     }

//     /**
//      * Dapatkan analisis terbaru untuk user
//      */
//     static async getLatestAnalysis(userId: string): Promise<CVAnalysisResultsRow | null> {
//         try {
//             const { data, error } = await supabase
//                 .from('cv_analysis_results')
//                 .select('*')
//                 .eq('user_id', userId)
//                 .order('created_at', { ascending: false })
//                 .limit(1)
//                 .single();

//             if (error) {
//                 if (error.code === 'PGRST116') { // No rows returned
//                     return null;
//                 }
//                 throw error;
//             }

//             return data;

//         } catch (error: unknown) {
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
//             const jobMatches: JobMatchesInsert[] = matches.map(match => ({
//                 user_id: userId,
//                 analysis_id: analysisId,
//                 job_data: match.jobData,
//                 match_score: match.matchScore,
//                 match_reason: match.matchReason,
//                 skills_match: Array.isArray(match.skillsMatch) ? match.skillsMatch : [],
//             }));

//             const { error } = await supabase
//                 .from('job_matches')
//                 .insert(jobMatches);

//             if (error) throw error;

//             console.log('✅ Job matches berhasil disimpan:', jobMatches.length, 'jobs');
//         } catch (error: unknown) {
//             console.error('Error saving job matches:', error);

//             let errorMessage = 'Failed to save job matches';
//             if (error instanceof Error) {
//                 errorMessage = `${errorMessage}: ${error.message}`;
//             }

//             throw new Error(errorMessage);
//         }
//     }

//     /**
//      * Dapatkan job matches untuk user
//      */
//     static async getJobMatches(userId: string, analysisId?: string): Promise<JobMatchesRow[]> {
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
//         } catch (error: unknown) {
//             console.error('Error getting job matches:', error);
//             return [];
//         }
//     }

//     /**
//      * Dapatkan semua analisis untuk user
//      */
//     static async getUserAnalyses(userId: string): Promise<CVAnalysisResultsRow[]> {
//         try {
//             const { data, error } = await supabase
//                 .from('cv_analysis_results')
//                 .select('*')
//                 .eq('user_id', userId)
//                 .order('created_at', { ascending: false });

//             if (error) throw error;
//             return data || [];

//         } catch (error: unknown) {
//             console.error('Error getting user analyses:', error);
//             return [];
//         }
//     }

//     /**
//      * Hapus analisis berdasarkan ID
//      */
//     static async deleteAnalysis(analysisId: string): Promise<void> {
//         try {
//             // Hapus job matches terlebih dahulu
//             const { error: jobMatchesError } = await supabase
//                 .from('job_matches')
//                 .delete()
//                 .eq('analysis_id', analysisId);

//             if (jobMatchesError) {
//                 console.warn('Warning deleting job matches:', jobMatchesError);
//             }

//             // Hapus analisis
//             const { error } = await supabase
//                 .from('cv_analysis_results')
//                 .delete()
//                 .eq('id', analysisId);

//             if (error) throw error;

//             console.log('✅ Analisis berhasil dihapus:', analysisId);
//         } catch (error: unknown) {
//             console.error('Error deleting analysis:', error);

//             let errorMessage = 'Failed to delete analysis';
//             if (error instanceof Error) {
//                 errorMessage = `${errorMessage}: ${error.message}`;
//             }

//             throw new Error(errorMessage);
//         }
//     }

//     /**
//      * Update analysis dengan data tambahan
//      */
//     static async updateAnalysis(analysisId: string, updates: Partial<AnalysisData>): Promise<void> {
//         try {
//             const updateData: CVAnalysisResultsUpdate = {};

//             if (updates.overallScore !== undefined) {
//                 updateData.overall_score = updates.overallScore;
//             }
//             if (updates.summary !== undefined) {
//                 updateData.summary = updates.summary;
//             }
//             if (updates.strengths !== undefined) {
//                 updateData.strengths = updates.strengths;
//             }
//             if (updates.improvements !== undefined) {
//                 updateData.improvements = updates.improvements;
//             }
//             if (updates.missingSkills !== undefined) {
//                 updateData.missing_skills = updates.missingSkills;
//             }
//             if (updates.skillMatch !== undefined) {
//                 updateData.skill_match = updates.skillMatch;
//             }
//             if (updates.recommendations !== undefined) {
//                 updateData.recommendations = updates.recommendations;
//             }
//             if (updates.personalInfo !== undefined) {
//                 updateData.personal_info = updates.personalInfo;
//             }
//             if (updates.professionalSummary !== undefined) {
//                 updateData.professional_summary = updates.professionalSummary;
//             }
//             if (updates.missingElements !== undefined) {
//                 updateData.missing_elements = updates.missingElements;
//             }

//             const { error } = await supabase
//                 .from('cv_analysis_results')
//                 .update(updateData)
//                 .eq('id', analysisId);

//             if (error) throw error;

//             console.log('✅ Analisis berhasil diupdate:', analysisId);
//         } catch (error: unknown) {
//             console.error('Error updating analysis:', error);

//             let errorMessage = 'Failed to update analysis';
//             if (error instanceof Error) {
//                 errorMessage = `${errorMessage}: ${error.message}`;
//             }

//             throw new Error(errorMessage);
//         }
//     }
// }