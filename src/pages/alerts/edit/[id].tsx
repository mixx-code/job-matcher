// pages/alerts/edit/[id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import AlertForm from '../../../components/AlertForm';
import { AlertFormData } from '../../../types/alert';
import { supabase } from '@/lib/supabaseClient';

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
        .eq('id', id)
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

      // Transform database data to form data
      const formData: AlertFormData = {
        name: alert.name,
        searchCriteria: alert.search_criteria,
        frequency: alert.frequency,
        notificationMethod: alert.notification_method,
        notificationTarget: alert.notification_target,
        isActive: alert.is_active,
      };

      setAlertData(formData);
    } catch (err: any) {
      console.error('Error fetching alert:', err);
      setError(err.message || 'Failed to load alert data');
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

      // Calculate next_run if frequency changed
      const updateData: any = {
        name: formData.name,
        search_criteria: formData.searchCriteria,
        frequency: formData.frequency,
        notification_method: formData.notificationMethod,
        notification_target: formData.notificationTarget,
        is_active: formData.isActive,
        updated_at: new Date().toISOString(),
      };

      // Check if frequency changed and update next_run accordingly
      if (alertData && alertData.frequency !== formData.frequency) {
        updateData.next_run = calculateNextRun(formData.frequency);
      }

      // Update alert in Supabase
      const { data: updatedAlert, error: updateError } = await supabase
        .from('alerts')
        .update(updateData)
        .eq('id', id)
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

    } catch (err: any) {
      console.error('Update alert error:', err);
      setError(err.message || 'Failed to update alert');
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
                {/* <LoadingSpinner size="large" /> */}
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

          {/* Database Info */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Editing Alert from Database</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>This alert is loaded from Supabase database.</p>
                  <p className="mt-1">Changes will be updated in real-time.</p>
                </div>
              </div>
            </div>
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
                  <div className="text-sm text-gray-500">
                    Alert ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{id}</span>
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

          {/* Database Information */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Database Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Update Process</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">1.</div>
                    <div className="ml-3">
                      <span className="font-medium">Validation</span>
                      <p className="text-xs">Form data is validated before submission</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">2.</div>
                    <div className="ml-3">
                      <span className="font-medium">User Check</span>
                      <p className="text-xs">Session is verified for security</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">3.</div>
                    <div className="ml-3">
                      <span className="font-medium">Database Update</span>
                      <p className="text-xs">Data is updated in Supabase alerts table</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">4.</div>
                    <div className="ml-3">
                      <span className="font-medium">Success Response</span>
                      <p className="text-xs">Redirect to alerts list upon success</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Technical Details</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <span className="font-medium">Table:</span>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">alerts</code>
                  </div>
                  <div>
                    <span className="font-medium">Update Query:</span>
                    <div className="mt-1 bg-gray-100 p-2 rounded text-xs font-mono">
                      UPDATE alerts<br />
                      SET name = ?, search_criteria = ?,<br />
                      frequency = ?, notification_method = ?,<br />
                      notification_target = ?, is_active = ?<br />
                      WHERE id = ? AND user_id = ?
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Security:</span>
                    <p className="text-xs mt-1">User ID check ensures users can only edit their own alerts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Test Validation</h3>
              <p className="mt-1 text-sm text-gray-600">Try these test scenarios:</p>
            </div>
            <div className="bg-white p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    const newData = { ...alertData };
                    newData.name = '';
                    setAlertData(newData);
                  }}
                  className="text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">Empty Name</span>
                  <p className="mt-1 text-sm text-gray-500">Test validation error for empty name</p>
                </button>
                <button
                  onClick={() => {
                    const newData = { ...alertData };
                    newData.notificationTarget = 'invalid-email';
                    setAlertData(newData);
                  }}
                  className="text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">Invalid Email</span>
                  <p className="mt-1 text-sm text-gray-500">Test email validation error</p>
                </button>
                <button
                  onClick={() => {
                    const newData = { ...alertData };
                    newData.searchCriteria.keywords = [];
                    setAlertData(newData);
                  }}
                  className="text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">No Keywords</span>
                  <p className="mt-1 text-sm text-gray-500">Test validation for empty keywords</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}