// pages/alerts/edit/[id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import AlertForm from '../../../components/AlertForm';
import { AlertFormData } from '../../../types/alert';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

// Type untuk search criteria dari database
type Json = Database['public']['Tables']['alerts']['Row']['search_criteria'];
type AlertRow = Database['public']['Tables']['alerts']['Row'];

// Interface untuk search criteria yang akan di-convert
// Tambahkan index signature untuk memenuhi tipe Json
interface SearchCriteriaJson {
  keywords: string[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  experienceLevel?: string;
  industry: string;
  remoteOnly: boolean;
  // Index signature untuk kompatibilitas dengan Json
  [key: string]: string | number | boolean | string[] | undefined;
}

// Type guard untuk mengecek apakah value adalah object
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Type guard untuk mengecek apakah value adalah string array
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

// Type guard untuk mengecek apakah value adalah SearchCriteriaJson
function isSearchCriteriaJson(value: unknown): value is SearchCriteriaJson {
  if (!isObject(value)) return false;

  const obj = value;
  return (
    Array.isArray(obj.keywords) &&
    typeof obj.location === 'string' &&
    typeof obj.remoteOnly === 'boolean'
  );
}

export default function EditAlertPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alertData, setAlertData] = useState<AlertFormData | null>(null);

  useEffect(() => {
    if (id) {
      fetchAlertData();
    }
  }, [id]);

  // Fungsi untuk mengonversi Json ke SearchCriteria
  const convertJsonToSearchCriteria = (json: Json): AlertFormData['searchCriteria'] => {
    if (!json) {
      return {
        keywords: [],
        location: '',
        salaryMin: undefined,
        salaryMax: undefined,
        jobType: undefined,
        experienceLevel: undefined,
        industry: '',
        remoteOnly: false,
      };
    }

    try {
      let parsedJson: unknown;

      // Parse jika json adalah string
      if (typeof json === 'string') {
        parsedJson = JSON.parse(json);
      } else {
        parsedJson = json;
      }

      if (!isSearchCriteriaJson(parsedJson)) {
        return {
          keywords: [],
          location: '',
          salaryMin: undefined,
          salaryMax: undefined,
          jobType: undefined,
          experienceLevel: undefined,
          industry: '',
          remoteOnly: false,
        };
      }

      const searchCriteria = parsedJson;

      return {
        keywords: Array.isArray(searchCriteria.keywords) ? searchCriteria.keywords : [],
        location: typeof searchCriteria.location === 'string' ? searchCriteria.location : '',
        salaryMin: typeof searchCriteria.salaryMin === 'number' ? searchCriteria.salaryMin : undefined,
        salaryMax: typeof searchCriteria.salaryMax === 'number' ? searchCriteria.salaryMax : undefined,
        industry: typeof searchCriteria.industry === 'string' ? searchCriteria.industry : '',
        remoteOnly: typeof searchCriteria.remoteOnly === 'boolean' ? searchCriteria.remoteOnly : false,
      };
    } catch (error) {
      console.error('Error parsing search criteria:', error);
      return {
        keywords: [],
        location: '',
        salaryMin: undefined,
        salaryMax: undefined,
        jobType: undefined,
        experienceLevel: undefined,
        industry: '',
        remoteOnly: false,
      };
    }
  };

  // Fungsi untuk mengonversi SearchCriteria ke Json
  const convertSearchCriteriaToJson = (searchCriteria: AlertFormData['searchCriteria']): Json => {
    const json: SearchCriteriaJson = {
      keywords: searchCriteria.keywords || [],
      location: searchCriteria.location || '',
      salaryMin: searchCriteria.salaryMin,
      salaryMax: searchCriteria.salaryMax,
      jobType: searchCriteria.jobType,
      experienceLevel: searchCriteria.experienceLevel,
      industry: searchCriteria.industry || '',
      remoteOnly: searchCriteria.remoteOnly || false,
    };
    return json;
  };

  const fetchAlertData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch alert from Supabase
      const { data: alert, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', String(id))
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Alert not found or you do not have permission to access it');
        }
        throw fetchError;
      }

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Konversi data dari database ke format form
      const alertRow = alert as AlertRow;
      const formData: AlertFormData = {
        name: alertRow.name || '',
        searchCriteria: convertJsonToSearchCriteria(alertRow.search_criteria),
        frequency: (alertRow.frequency === 'daily' || alertRow.frequency === 'weekly')
          ? alertRow.frequency
          : 'daily',
        notificationMethod: (alertRow.notification_method === 'email' || alertRow.notification_method === 'telegram')
          ? alertRow.notification_method
          : 'email',
        notificationTarget: alertRow.notification_target || '',
        isActive: alertRow.is_active !== null ? alertRow.is_active : true,
      };

      setAlertData(formData);
    } catch (err: unknown) {
      console.error('Error fetching alert:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alert data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: AlertFormData) => {
    try {
      setSaving(true);
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

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Your session has expired. Please login again.');
      }

      // Interface untuk update data
      interface UpdateData {
        name: string;
        search_criteria: Json;
        frequency: 'daily' | 'weekly';
        notification_method: 'email' | 'telegram';
        notification_target: string;
        is_active: boolean;
        updated_at: string;
        next_run?: string;
      }

      const updateData: UpdateData = {
        name: formData.name,
        search_criteria: convertSearchCriteriaToJson(formData.searchCriteria),
        frequency: formData.frequency,
        notification_method: formData.notificationMethod,
        notification_target: formData.notificationTarget,
        is_active: formData.isActive,
        updated_at: new Date().toISOString(),
      };

      // Check if frequency changed and update next_run accordingly
      if (alertData && alertData.frequency !== formData.frequency) {
        const nextRun = calculateNextRun(formData.frequency);
        updateData.next_run = nextRun.toISOString();
      }

      // Update alert in Supabase
      const { data: updatedAlert, error: updateError } = await supabase
        .from('alerts')
        .update(updateData)
        .eq('id', String(id))
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(`Failed to update alert: ${updateError.message}`);
      }

      // Show success message
      setSuccess(true);
      
      // Redirect setelah delay
      setTimeout(() => {
        router.push('/alerts');
      }, 1500);

    } catch (err: unknown) {
      console.error('Update alert error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update alert';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to calculate next run time
  const calculateNextRun = (frequency: 'daily' | 'weekly'): Date => {
    const now = new Date();
    const nextRun = new Date(now);
    
    if (frequency === 'daily') {
      nextRun.setDate(nextRun.getDate() + 1);
    } else {
      nextRun.setDate(nextRun.getDate() + 7);
    }
    
    // Set to 8 AM
    nextRun.setHours(8, 0, 0, 0);
    
    return nextRun;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <button
                onClick={() => router.push('/alerts')}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Alerts
              </button>
            </div>
            
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading alert data from database...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!alertData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <button
                onClick={() => router.push('/alerts')}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Alerts
              </button>
            </div>

            <div className="bg-white shadow rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Alert not found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {error || "The alert you're trying to edit doesn't exist or you don't have permission to access it."}
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/alerts')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Alerts
                </button>
                <button
                  onClick={() => router.push('/alerts/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create New Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/alerts')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              disabled={saving}
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
                    <p>Job alert updated successfully! Redirecting to alerts page...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Main Content */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8 sm:p-10">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Job Alert</h1>
                    <p className="mt-2 text-sm text-gray-600">
                      Update your job alert settings
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert Form */}
              <AlertForm
                onSubmit={handleSubmit}
                loading={saving}
                initialData={alertData}
                isEdit={true}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}