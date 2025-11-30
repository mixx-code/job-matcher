import { Session } from '@supabase/supabase-js'

export type AuthSession = Session | null

// Add Database types for Supabase
export interface Database {
    public: {
        Tables: {
            user_cvs: {
                Row: {
                    id: string
                    user_id: string
                    file_name: string
                    file_url: string
                    file_size: number
                    file_type: string
                    storage_path: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    file_name: string
                    file_url: string
                    file_size: number
                    file_type: string
                    storage_path: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    file_name?: string
                    file_url?: string
                    file_size?: number
                    file_type?: string
                    storage_path?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            cv_analysis_results: {
                Row: CVAnalysisResult;
                Insert: Omit<CVAnalysisResult, 'id' | 'created_at'>;
                Update: Partial<Omit<CVAnalysisResult, 'id' | 'user_id' | 'created_at'>>;
            }
            job_matches: {
                Row: JobMatch;
                Insert: Omit<JobMatch, 'id' | 'created_at'>;
                Update: Partial<Omit<JobMatch, 'id' | 'user_id' | 'created_at'>>;
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
            }
        }
    }
}

// Type for CV file data
export interface CVFile {
    id: string
    user_id: string
    file_name: string
    file_url: string
    file_size: number
    file_type: string
    storage_path: string
    created_at: string
    updated_at: string
}

// Tambahkan interface untuk analysis results
export interface CVAnalysisResult {
    id: string;
    user_id: string;
    cv_id: string;
    overall_score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    missing_skills: string[];
    skill_match: Record<string, number>;
    recommendations: string[];
    analysis_data: any;
    created_at: string;
}

export interface JobMatch {
    id: string;
    user_id: string;
    analysis_id: string;
    job_data: any;
    match_score: number;
    match_reason: string;
    skills_match: string[];
    created_at: string;
}

