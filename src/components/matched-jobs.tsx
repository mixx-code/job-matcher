import MatchedJobsList from './MatchedJobsList';
import { Button, Progress, Tag, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { Badge, Bot } from 'lucide-react';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DashboardOutlined, EnvironmentOutlined, FilterOutlined, FireOutlined, InfoCircleOutlined, RocketOutlined, SearchOutlined, StarOutlined, SyncOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons';
import { supabase } from '@/lib/supabaseClient';
import { JobIndo } from '@/types/job-indo';
import type { CSSProperties } from 'react';

// Definisikan tipe-tipe yang dibutuhkan
interface MatchedJob {
  id: string;
  title: string;
  company: string;
  location?: string;
  match_score: number;
  skills?: string[];
  salary_range?: string;
  description?: string;
  url?: string;
}

interface JobForList {
  id: string;
  job_url: string;
  job_title: string;
  company: string;
  location: string;
  job_description: string;
  is_remote: boolean;
  salary_range: string;
  match_score: number;
  match_reasons: string[];
  missing_skills: string[];
  recommended_actions: string[];
}

interface FilteringStats {
  total_processed?: number;
  matched_count?: number;
  match_rate?: number;
  processing_time?: number;
}

interface MatchedJobsPageProps {
  dataJobApi: MatchedJob[] | { matched_jobs: MatchedJob[] };
  dataJobsIndo?: JobIndo[];
  user_id: string;
}

const MatchedJobsPage: React.FC<MatchedJobsPageProps> = ({ dataJobApi, dataJobsIndo, user_id }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [dataRekomendasiJobs, setDataRekomendasiJobs] = useState<MatchedJob[]>([]);
  const [listJobs, setListJobs] = useState<MatchedJob[]>([]);

  console.log("dataRekomendasiJobs: ", dataRekomendasiJobs);
  console.log("user_id: ", user_id);
  console.log("dataJobApi: ", dataJobApi);

  // EFFECT 1: Update listJobs berdasarkan dataRekomendasiJobs dan dataJobApi
  useEffect(() => {
    console.log("EFFECT RUNNING: dataRekomendasiJobs changed", dataRekomendasiJobs);

    let newListJobs: MatchedJob[] = [];

    // PRIORITAS: Gunakan dataRekomendasiJobs jika ada
    if (dataRekomendasiJobs.length > 0) {
      console.log("Menggunakan dataRekomendasiJobs:", dataRekomendasiJobs.length);
      newListJobs = dataRekomendasiJobs;
    }
    // Jika tidak ada dataRekomendasiJobs, gunakan dataJobApi
    else if (Array.isArray(dataJobApi)) {
      console.log("Menggunakan dataJobApi (array):", dataJobApi.length);
      newListJobs = dataJobApi;
    }
    else if (dataJobApi && 'matched_jobs' in dataJobApi) {
      console.log("Menggunakan dataJobApi (objek):", dataJobApi.matched_jobs?.length);
      newListJobs = dataJobApi.matched_jobs || [];
    }

    console.log("newListJobs yang akan di-set:", newListJobs);
    setListJobs(newListJobs);

  }, [dataRekomendasiJobs, dataJobApi]);

  // EFFECT 2: Load from localStorage hanya sekali saat mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      const jobs = localStorage.getItem('jobs');
      console.log("Mengambil jobs dari localStorage:", jobs);

      if (jobs) {
        try {
          const parsedJobs = JSON.parse(jobs);
          console.log("Parsed jobs:", parsedJobs);

          let jobsArray: MatchedJob[] = [];

          // Extract array dari berbagai format
          if (Array.isArray(parsedJobs)) {
            jobsArray = parsedJobs;
          }
          else if (parsedJobs && 'matched_jobs' in parsedJobs && Array.isArray(parsedJobs.matched_jobs)) {
            jobsArray = parsedJobs.matched_jobs;
          }
          else if (parsedJobs && 'success' in parsedJobs && Array.isArray(parsedJobs.matched_jobs)) {
            jobsArray = parsedJobs.matched_jobs;
          }

          if (jobsArray.length > 0) {
            console.log("Mengatur data dari localStorage:", jobsArray.length);
            setDataRekomendasiJobs(jobsArray);
          }

        } catch (error) {
          console.error("Error parsing jobs from localStorage:", error);
        }
      }
    };

    loadFromLocalStorage();
  }, []); // Hanya jalankan sekali saat mount

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
        return {
          success: false,
          message: error.message || 'Gagal mengambil data analisis CV',
          error: error,
          data: []
        };
      }

      console.log('Data analisis CV ditemukan:', data);

      if (data && data.length > 0 && data[0]) {
        console.log('Mengatur data analisis CV ke state');
        return {
          success: true,
          data: data[0].analysis_data,
          hasData: true
        };
      } else {
        console.log('Tidak ada data analisis CV ditemukan untuk user:', userId);
        return {
          success: true,
          data: [],
          hasData: false,
          message: 'Belum ada data analisis CV'
        };
      }

    } catch (error) { // Type assertion untuk error
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengambil data analisis CV';
      console.error('Error dalam getUserCvAnalyses:', error);
      return {
        success: false,
        message: errorMessage,
        error: error,
        data: []
      };
    }
  };

  const handleSearchJobs = async (): Promise<void> => {
    try {
      setLoading(true);

      const analisisCv = await getUserCvAnalyses(String(user_id));
      console.log("analisisCv: ", analisisCv.data);

      if (!analisisCv.success || !analisisCv.data) {
        console.error("Tidak ada data analisis CV yang valid");
        setLoading(false);
        return;
      }

      const findJobs = await fetch('/api/rekomendasi-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hasilAnalisis: analisisCv.data,
          listJobs: dataJobsIndo
        }),
      });

      if (!findJobs.ok) {
        throw new Error(`HTTP error! status: ${findJobs.status}`);
      }

      const jobsResult = await findJobs.json();
      console.log('Jobs result from API:', jobsResult);

      // PERBAIKAN: Ekstrak array dari response API
      let jobsArray: MatchedJob[] = [];

      if (Array.isArray(jobsResult)) {
        jobsArray = jobsResult;
      }
      else if (jobsResult && 'matched_jobs' in jobsResult && Array.isArray(jobsResult.matched_jobs)) {
        jobsArray = jobsResult.matched_jobs;
      }
      else if (jobsResult && 'success' in jobsResult && Array.isArray(jobsResult.matched_jobs)) {
        jobsArray = jobsResult.matched_jobs;
      }

      console.log('Extracted jobs array:', jobsArray);

      // Simpan ke localStorage
      localStorage.setItem('jobs', JSON.stringify(jobsResult));

      // Update state - INI YANG AKAN MEMICU RENDER ULANG
      setDataRekomendasiJobs(jobsArray);

    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengonversi MatchedJob ke JobForList
  const convertToJobFormat = (matchedJobs: MatchedJob[]): JobForList[] => {
    return matchedJobs.map(job => ({
      id: job.id,
      job_url: job.url || '#',
      job_title: job.title || 'Untitled Position',
      company: job.company,
      location: job.location || 'Location not specified',
      job_description: job.description || 'No job description available.',
      is_remote: false,
      salary_range: job.salary_range || 'Salary not disclosed',
      match_score: job.match_score,
      match_reasons: job.skills
        ? [`Skills match: ${job.skills.slice(0, 3).join(', ')}${job.skills.length > 3 ? '...' : ''}`]
        : ['Good overall match'],
      missing_skills: [],
      recommended_actions: ['Review full job description', 'Prepare tailored resume']
    }));
  };

  // Fungsi untuk mendapatkan style button
  const getButtonStyle = (): CSSProperties | undefined => {
    if (loading) {
      return {
        background: "#1778ff",
        borderColor: "#1778ff",
        color: "#fff",
      };
    }
    return undefined;
  };

  return (
    <div className="w-full p-5 bg-gray-50 min-h-screen flex flex-col items-center mx-auto">
      {/* Search Button Section */}
      <div className="w-full mb-8 flex items-center gap-4">
        <Button
          type="primary"
          icon={<Bot />}
          loading={loading}
          disabled={loading}
          style={getButtonStyle()}
          onClick={handleSearchJobs}
          className="flex items-center gap-2"
        >
          {loading ? "Searching Jobs..." : "Find Matching Jobs"}
        </Button>
      </div>

      {/* Header Section */}
      <div className="w-full mb-6 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 text-white p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">
              Job Recommendations
            </h1>
            <p className="text-blue-100">
              Based on your profile and preferences
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="text-2xl text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Right Column - Job Listings */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Job List Header */}
            {listJobs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <SearchOutlined style={{ fontSize: '48px' }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Jobs Found
                </h3>
                <p className="text-gray-500 mb-6">
                  Click &quot;Find Matching Jobs&quot; to start searching for opportunities
                </p>
                <Button
                  type="primary"
                  icon={<Bot />}
                  onClick={handleSearchJobs}
                  loading={loading}
                >
                  Find Matching Jobs
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                          <CheckCircleOutlined className="text-green-600 text-base sm:text-lg" />
                          <span className="whitespace-nowrap">Matched Job Opportunities</span>
                        </h2>
                        <div className="sm:hidden">
                          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm inline-block">
                            {listJobs.length} Jobs
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        Found {listJobs.length} matching jobs based on your profile
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold whitespace-nowrap">
                        {listJobs.length} Jobs
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Tag color="blue" icon={<FireOutlined />} className="text-xs sm:text-sm">
                      <span className="hidden xs:inline">AI-Powered</span>
                      <span className="xs:hidden">AI</span>
                    </Tag>
                    <Tag color="green" icon={<ThunderboltOutlined />} className="text-xs sm:text-sm">
                      <span className="hidden xs:inline">Real-time</span>
                      <span className="xs:hidden">Live</span>
                    </Tag>
                    <Tag color="purple" icon={<StarOutlined />} className="text-xs sm:text-sm">
                      <span className="hidden xs:inline">Personalized</span>
                      <span className="xs:hidden">Custom</span>
                    </Tag>
                  </div>
                </div>

                {/* Job List Content - INI YANG DIPERBAIKI */}
                <div className="p-6">
                  <MatchedJobsList jobs={convertToJobFormat(listJobs)} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchedJobsPage;