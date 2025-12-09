// pages/alerts/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Alert } from '../../types/alert';
import AlertCard from '../../components/AlertCard';
import Layout from '../../components/Layout';
import { supabase } from '@/lib/supabaseClient';

import {
    FilteringStats,
    MatchedJob,
} from '@/types/jobTypes';
import { getCurrentSession, getCurrentUserWithProfile } from '@/lib/getSession';
interface MatchedJobsPageProps {
    dataJobApi: MatchedJob[];
  dataJobsIndo?: JobIndo[];
    user_id: string
}


type FilterType = 'all' | 'active' | 'inactive';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [dataRekomendasiJobs, setDataRekomendasiJobs] = useState<MatchedJob[]>([]);
  const [jobsIndo, setJobsIndo] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchAlerts();
    fetchAllJobs();
    getAllAlerts();
  }, []);
  const getAllAlerts = async () => {
    const { data: alertsData, error } = await supabase
      .from('alerts')
      .select('*')

    console.log(alertsData)
    if (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch alerts from Supabase
      const { data: alertsData, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        throw error;
      }

      setAlerts(alertsData || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (alertId: string, currentStatus: boolean) => {
    try {
      setToggleLoading(alertId);

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Update alert in Supabase
      const { error } = await supabase
        .from('alerts')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Update local state
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId
          ? { ...alert, is_active: !currentStatus, updated_at: new Date().toISOString() }
          : alert
      ));
    } catch (error: any) {
      console.error('Error toggling alert:', error);
      alert('Failed to update alert status');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert? This action cannot be undone.')) return;

    try {
      setDeleteLoading(alertId);

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Delete alert from Supabase
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error: any) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (alertId: string) => {
    router.push(`/alerts/edit/${alertId}`);
  };
      const getUserCvAnalyses = async (userId: string) => {
        try {
            if (!userId) {
                throw new Error('User ID diperlukan');
            }

            const { data, error } = await supabase
                .from('cv_analyses')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('Error mengambil data dari Supabase:', error);
                // Jangan throw error, kembalikan success: false
                return {
                    success: false,
                    message: error.message || 'Gagal mengambil data analisis CV',
                    error: error,
                    data: []
                };
            }

            console.log('Data analisis CV ditemukan:', data);

            // Cek apakah ada data
            if (data && data.length > 0 && data[0]) {
                console.log('Mengatur data analisis CV ke state');
                // setDataCvAnalysis(data[0].analysis_data);

                return {
                    success: true,
                    data: data[0].analysis_data,
                    hasData: true
                };
            } else {
                console.log('Tidak ada data analisis CV ditemukan untuk user:', userId);
                // Set state ke null atau empty object
                // setDataCvAnalysis(null);

                return {
                    success: true,
                    data: [],
                    hasData: false,
                    message: 'Belum ada data analisis CV'
                };
            }

        } catch (error) {
            console.error('Error dalam getUserCvAnalyses:', error);
            return {
                success: false,
                message: error.message || 'Gagal mengambil data analisis CV',
                error: error,
                data: []
            };
        }
    };

    const fetchAllJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const result = await response.json()

      if (result.success) {
        console.log("ini result", result.data)
        // result.data berisi semua jobs sekaligus
        console.log(`Total jobs: ${result.count}`)
        setJobsIndo(result.data)
        return result.data
      }
      return []
    } catch (error) {
      console.error('Error:', error)
      return []
    }
  };

const handleSend = async (alert: Alert) => {
  console.log('Send alert:', alert);
  
  try {
    // 1. Fetch analisis CV
     const [sessionData, userData] = await Promise.all([
          getCurrentSession(),
          getCurrentUserWithProfile()
        ]);

        console.log("userData :", userData?.id);
    const analisisCv = await getUserCvAnalyses(String(userData?.id));
    console.log("analisisCv: ", analisisCv.data);

    // 2. Dapatkan rekomendasi jobs
    const findJobs = await fetch('/api/rekomendasi-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hasilAnalisis: analisisCv.data,
        listJobs: jobsIndo
      }),
    });
    
    const jobsResult = await findJobs.json();
    console.log('Jobs found:', jobsResult);




    // 3. Kirim alert dengan data jobs
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: "rizki",
        email: alert.notification_target || "",
        alert: alert,
        jobs: jobsResult // Gunakan hasil langsung dari API
      }),
    });

    // Periksa response
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(errorData.error || 'Failed to send');
    }

    const data = await response.json();
    console.log('Success:', data);
    
    // Update state jika diperlukan untuk UI
    setDataRekomendasiJobs(jobsResult);

  } catch (error) {
    console.error('Error sending alert:', error);
  }
}

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(alert =>
      filter === 'active' ? alert.is_active : !alert.is_active
    );

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.is_active).length,
    daily: alerts.filter(a => a.frequency === 'daily').length,
    weekly: alerts.filter(a => a.frequency === 'weekly').length
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Alerts</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your job alerts and get notified when new jobs match your criteria
              </p>
            </div>
            <button
              onClick={() => router.push('/alerts/create')}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Alert
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Daily Alerts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.daily}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Weekly Alerts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.weekly}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(['all', 'active', 'inactive'] as FilterType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  disabled={loading}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm
                    ${filter === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-2 bg-gray-100 text-gray-900 rounded-full px-2 py-0.5 text-xs">
                    {tab === 'all' ? stats.total :
                      tab === 'active' ? stats.active :
                        stats.total - stats.active}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading alerts from database...</p>
            </div>
          )}

          {/* Alerts List */}
          {!loading && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filter === 'all'
                      ? "Get started by creating your first job alert."
                      : filter === 'active'
                        ? "No active alerts found."
                        : "No inactive alerts found."
                    }
                  </p>
                  {filter === 'all' && (
                    <div className="mt-6">
                      <button
                        onClick={() => router.push('/alerts/create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Create Your First Alert
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredAlerts.map((alert) => (
                    <li key={alert.id}>
                      <AlertCard
                        alert={alert}
                        onToggleActive={handleToggleActive}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onSend={handleSend}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}