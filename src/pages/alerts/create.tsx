// pages/alerts/create.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertFormData } from '../../types/alert';
import AlertForm from '../../components/AlertForm';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { checkAuthStatus, getCurrentSession, getCurrentUserWithProfile } from '@/lib/getSession';
import { Session } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Buat alias untuk tipe yang dibutuhkan
type Profile = Database['public']['Tables']['profiles']['Row'];
type CVAnalysis = Database['public']['Tables']['cv_analyses']['Row'];
type Json = Database['public']['Tables']['cv_analyses']['Row']['analysis_data'];

// Tipe untuk user dengan profile
interface UserWithProfile {
  id: string;
  email?: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Type untuk CV Analysis Data
interface SkillMatch {
  education: number;
  technical: number;
  experience: number;
  presentation: number;
}

interface PersonalInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
}

interface ProfessionalSummary {
  field: string;
  keyExpertise: string[];
  experienceLevel: string;
}

interface AnalysisMetadata {
  cvLength: number;
  timestamp: string;
  processingTime: number;
}

interface CVAnalysisData {
  skill?: string[];
  skills?: string[];
  success?: boolean;
  summary?: string;
  strengths?: string[];
  skillMatch?: SkillMatch;
  improvements?: string[];
  overallScore?: number;
  personalInfo?: PersonalInfo;
  missingSkills?: string[];
  missingElements?: string[];
  recommendations?: string[];
  rekomendasiJobs?: string[];
  analysisMetadata?: AnalysisMetadata;
  professionalSummary?: ProfessionalSummary;
}

// Type untuk search criteria yang compatible dengan Json
interface SearchCriteriaJson {
  keywords: string[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  experienceLevel?: string;
  industry: string;
  remoteOnly: boolean;
  [key: string]: Json | undefined; // Index signature untuk Json compatibility
}

// Type guard untuk mengecek apakah value adalah object
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Type guard untuk mengecek apakah value adalah string array
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export default function CreateAlertPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Cek auth status dulu
        const authStatus = await checkAuthStatus();
        if (!authStatus.isAuthenticated) {
          router.push("/login");
          return;
        }

        // Ambil session dan user secara paralel
        const [sessionData, userData] = await Promise.all([
          getCurrentSession(),
          getCurrentUserWithProfile()
        ]);

        setSession(sessionData);
        setUser(userData);

        console.log("userData:", userData);

        if (userData?.id) {
          // Ambil data CV analysis terbaru
          const { data, error } = await supabase
            .from('cv_analyses')
            .select('*')
            .eq('user_id', userData.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error('Error fetching CV data:', error);
            return;
          }

          if (data && data.length > 0) {
            const cvAnalysis = data[0];

            // Ekstrak skills dari analysis_data
            const extractedSkills = extractSkillsFromCVData(cvAnalysis.analysis_data);
            setSkills(extractedSkills);
            console.log('Extracted skills:', extractedSkills);
          } else {
            console.log('No CV analysis data found for user:', userData.id);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  // Fungsi untuk mengekstrak skills dari data CV
  const extractSkillsFromCVData = (analysisData: Json): string[] => {
    if (!analysisData) return [];

    try {
      let parsedData: unknown;

      // Parse JSON jika analysisData adalah string
      if (typeof analysisData === 'string') {
        parsedData = JSON.parse(analysisData);
      } else {
        parsedData = analysisData;
      }

      // Jika bukan object, return empty array
      if (!isObject(parsedData)) {
        return [];
      }

      const skillsList: string[] = [];
      const data = parsedData as CVAnalysisData;

      // 1. Dari properti 'skill' (array)
      if (isStringArray(data.skill)) {
        skillsList.push(...data.skill.filter(s => s.trim().length > 0));
      }

      // 2. Dari 'skills' (mungkin typo atau versi lain)
      if (isStringArray(data.skills)) {
        skillsList.push(...data.skills.filter(s => s.trim().length > 0));
      }

      // 3. Dari 'professionalSummary.keyExpertise'
      if (data.professionalSummary?.keyExpertise && isStringArray(data.professionalSummary.keyExpertise)) {
        skillsList.push(...data.professionalSummary.keyExpertise.filter(s => s.trim().length > 0));
      }

      // 4. Dari 'strengths'
      if (isStringArray(data.strengths)) {
        skillsList.push(...data.strengths.filter(s => s.trim().length > 0));
      }

      // 5. Dari 'skillMatch' (ambil keys jika ada)
      if (data.skillMatch && isObject(data.skillMatch)) {
        const skillMatchKeys = Object.keys(data.skillMatch);
        // Filter hanya keys yang bukan property default SkillMatch
        const nonDefaultKeys = skillMatchKeys.filter(key =>
          !['education', 'technical', 'experience', 'presentation'].includes(key)
        );
        if (nonDefaultKeys.length > 0) {
          skillsList.push(...nonDefaultKeys);
        }
      }

      // 6. Coba cari array lain dalam object
      if (skillsList.length === 0) {
        Object.values(parsedData).forEach(value => {
          if (isStringArray(value)) {
            value.forEach(item => {
              if (typeof item === 'string' && item.trim().length > 0) {
                skillsList.push(item.trim());
              }
            });
          }
        });
      }

      // Hapus duplikat dan kosong
      const uniqueSkills = [...new Set(skillsList.map(s => s.trim()).filter(s => s.length > 0))];

      // Batasi jumlah skills (misal maksimal 10)
      return uniqueSkills.slice(0, 10);

    } catch (parseError) {
      console.error('Error parsing CV data:', parseError);
      return [];
    }
  };

  // Fungsi untuk mengonversi SearchCriteria ke format Json
  const convertSearchCriteriaToJson = (searchCriteria: AlertFormData['searchCriteria']): SearchCriteriaJson => {
    return {
      keywords: searchCriteria.keywords || [],
      location: searchCriteria.location || '',
      salaryMin: searchCriteria.salaryMin,
      salaryMax: searchCriteria.salaryMax,
      jobType: searchCriteria.jobType,
      experienceLevel: searchCriteria.experienceLevel,
      industry: searchCriteria.industry || '',
      remoteOnly: searchCriteria.remoteOnly || false,
      ...Object.fromEntries(Object.entries(searchCriteria).filter(([key]) => key !== 'keywords')),
    };
  };

  const handleSubmit = async (formData: AlertFormData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validasi input
      if (!formData.name.trim()) {
        throw new Error('Alert name is required');
      }

      if (!formData.notificationTarget.trim()) {
        throw new Error('Notification target is required');
      }

      if (formData.notificationMethod === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.notificationTarget)) {
          throw new Error('Please enter a valid email address');
        }
      } else if (formData.notificationMethod === 'telegram') {
        const telegramRegex = /^@[a-zA-Z0-9_]{5,}$/;
        if (!telegramRegex.test(formData.notificationTarget)) {
          throw new Error('Please enter a valid Telegram username (e.g., @username)');
        }
      }

      // Hitung next_run berdasarkan frequency
      const nextRun = calculateNextRun(formData.frequency);

      // Ambil user session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to create an alert');
      }

      // Konversi search_criteria ke format yang compatible dengan Json
      const searchCriteriaJson = convertSearchCriteriaToJson(formData.searchCriteria);

      // Type untuk insert data
      const insertData = {
        user_id: session.user.id,
        name: formData.name,
        search_criteria: searchCriteriaJson as Json, // Type assertion ke Json
        frequency: formData.frequency,
        notification_method: formData.notificationMethod,
        notification_target: formData.notificationTarget,
        is_active: formData.isActive,
        next_run: nextRun.toISOString(),
        match_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert ke database
      const { data: alert, error: insertError } = await supabase
        .from('alerts')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Supabase error:', insertError);
        throw new Error(`Failed to create alert: ${insertError.message}`);
      }

      // Show success message
      setSuccess(true);

      // Redirect setelah delay
      setTimeout(() => {
        router.push('/alerts');
      }, 1500);

    } catch (err: unknown) {
      console.error('Create alert error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create alert';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi helper untuk menghitung next_run
  const calculateNextRun = (frequency: 'daily' | 'weekly'): Date => {
    const now = new Date();
    const nextRun = new Date(now);

    if (frequency === 'daily') {
      nextRun.setDate(nextRun.getDate() + 1);
    } else {
      nextRun.setDate(nextRun.getDate() + 7);
    }

    // Set ke jam 8 pagi
    nextRun.setHours(8, 0, 0, 0);

    return nextRun;
  };

  // Debug: Tampilkan skills yang didapat
  console.log('Skills from CV analysis:', skills);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/alerts')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Alerts
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Job alert created successfully! Redirecting to alerts page...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8 sm:p-10">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create Job Alert</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Set up automatic notifications for new jobs matching your criteria
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert Form */}
              <AlertForm
                onSubmit={handleSubmit}
                loading={loading}
                initialData={{
                  name: '',
                  searchCriteria: {
                    keywords: skills,
                    location: '',
                    salaryMin: undefined,
                    salaryMax: undefined,
                    jobType: undefined,
                    experienceLevel: undefined,
                    industry: '',
                    remoteOnly: false,
                  },
                  frequency: 'daily',
                  notificationMethod: 'email',
                  notificationTarget: user?.email || '',
                  isActive: true,
                }}
              />
            </div>
          </div>

          {/* Information Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Information</h3>
            <p className="text-sm text-blue-700 mb-4">
              Skills extracted from your latest CV analysis: {skills.length > 0 ? (
                <span className="font-semibold">
                  {skills.slice(0, 5).join(', ')}
                  {skills.length > 5 ? `, +${skills.length - 5} more...` : ''}
                </span>
              ) : (
                <span className="text-gray-500">No skills found. Please upload a CV first.</span>
              )}
            </p>
            <div className="text-sm text-blue-600 space-y-2">
              <p>✓ {skills.length} skills automatically extracted from your CV analysis</p>
              <p>✓ You can add or remove keywords in the form above</p>
              <p>✓ Alerts will check for new jobs every day or week based on your selection</p>
              <p className="text-xs text-blue-500 mt-2">
                Skills are extracted from: skill[], skills[], professionalSummary.keyExpertise, strengths[], and other relevant fields
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}