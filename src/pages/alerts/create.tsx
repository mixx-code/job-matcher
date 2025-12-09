// pages/alerts/create.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertFormData } from '../../types/alert';
import AlertForm from '../../components/AlertForm';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { checkAuthStatus, getCurrentSession, getCurrentUserWithProfile } from '@/lib/getSession';
import { Session } from 'inspector/promises';

export default function CreateAlertPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<any>(null);
  const [skills, setSkills] = useState<any>(null);
  useEffect(() => {
      const initializeAuth = async () => {
        try {
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
          // setUserId(userData?.id);
  
          console.log("userData :", userData?.id);
  
          // PERBAIKAN: Query yang benar untuk mengambil CV berdasarkan user_id
          const { data, error } = await supabase
            .from('cv_analyses')
            .select('*')
            .eq('user_id', String(userData?.id))
            .order('created_at', { ascending: false })
            .limit(1)
          console.log("skill:", data[0].analysis_data.skill);
  
          if (error) {
            console.error('Error fetching CV data:', error);
          }
  
          if (data && data.length > 0) {
            // console.log("CV data:", data[0]);
            setSkills(data[0].analysis_data.skill);
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

      // Insert ke database
      const { data: alert, error: insertError } = await supabase
        .from('alerts')
        .insert({
          user_id: session.user.id,
          name: formData.name,
          search_criteria: formData.searchCriteria,
          frequency: formData.frequency,
          notification_method: formData.notificationMethod,
          notification_target: formData.notificationTarget,
          is_active: formData.isActive,
          next_run: nextRun.toISOString(),
          match_count: 0
        })
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

    } catch (err: any) {
      console.error('Create alert error:', err);
      setError(err.message || 'Failed to create alert');
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
                  notificationTarget: '',
                  isActive: true,
                }}
              />
            </div>
          </div>

          {/* Sample Data Section */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Data for Testing</h3>
            <p className="text-sm text-gray-600 mb-4">
              Try these sample values to quickly create a test alert:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">For Email Notification:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Alert Name: "Frontend Developer Remote"</li>
                  <li>• Keywords: "React, TypeScript, Next.js"</li>
                  <li>• Location: "Remote"</li>
                  <li>• Email: "your-email@example.com"</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">For Telegram Notification:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Alert Name: "Backend Developer Jakarta"</li>
                  <li>• Keywords: "Node.js, Python, AWS"</li>
                  <li>• Location: "Jakarta"</li>
                  <li>• Telegram: "@your_username"</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Validation Rules:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Email must be valid format</li>
                <li>✓ Telegram must start with @</li>
                <li>✓ At least one keyword is required</li>
                <li>✓ Alert name is required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}