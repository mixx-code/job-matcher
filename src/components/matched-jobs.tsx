import { mockData } from '@/data/mockData';
import MatchedJobsList from './MatchedJobsList';
import { Button, Progress, Tag, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { Badge, Bot } from 'lucide-react';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DashboardOutlined, EnvironmentOutlined, FilterOutlined, FireOutlined, InfoCircleOutlined, RocketOutlined, SearchOutlined, StarOutlined, SyncOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons';
import {
  FilteringStats,
  MatchedJob,
} from '@/types/jobTypes';
import { supabase } from '@/lib/supabaseClient';
import AllJobsList from './AllJobsList';
import { JobIndo } from '@/types/job-indo';

interface MatchedJobsPageProps {
  dataJobApi: MatchedJob[];
  dataJobsIndo?: JobIndo[];
  user_id: string
}

const MatchedJobsPage: React.FC<MatchedJobsPageProps> = ({ dataJobApi, dataJobsIndo, user_id }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [dataRekomendasiJobs, setDataRekomendasiJobs] = useState<MatchedJob[]>([]);

  console.log("dataRekomendasiJobs: ", dataRekomendasiJobs);


  console.log("user_id: ", user_id);


  console.log("dataJobApi: ", dataJobApi.dataJobApi);

  const listJobs = dataRekomendasiJobs.matched_jobs || [];
  console.log("listJobs: ", listJobs);
  console.log("dataJobApi: ", dataJobApi);
  // Cast data ke tipe yang sesuai
  // const jobs = mockData.matched_jobs as MatchedJob[];
  // const filteringStats = dataRekomendasiJobs.filtering_stats as FilteringStats || [];

  useEffect(() => {
    if (dataRekomendasiJobs.length === 0) {
      const jobs = localStorage.getItem('jobs');
      console.log("jobs local: ", jobs);
      if (jobs) {
        setDataRekomendasiJobs(JSON.parse(jobs));
      }
    }
  }, [dataRekomendasiJobs]);


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

  const handleSearchJobs = async (): Promise<void> => {
    try {
      setLoading(true);

      const analisisCv = await getUserCvAnalyses(String(user_id));
      console.log("analisisCv: ", analisisCv.data);
      // console.log("skill: ", analisisCv.data.skill);
      console.log("dataJobsIndo: ", dataJobsIndo);


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
      const jobs = await findJobs.json();
      setDataRekomendasiJobs(jobs);
      localStorage.setItem('jobs', JSON.stringify(jobs));
      console.log(
        'Jobs found:',
        jobs
      )
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-5 bg-gray-50 min-h-screen flex flex-col items-center mx-auto">
      {/* Search Button Section */}
      <div className="w-full mb-8 flex items-center gap-4">
        <Button
          type="primary"
          icon={<Bot />}
          loading={loading && { icon: <SyncOutlined spin /> }}
          disabled={loading}
          style={
            loading && {
              background: "#1778ff",
              borderColor: "#1778ff",
              color: "#fff",
            }
          }
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
        {/* Left Column - Stats and Metadata */}


        {/* Right Column - Job Listings */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Job List Header */}
            {listJobs.length === 0 ? (
              ""
            ) : (
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
            )}

            {/* Job List Content */}
            <div className="p-6">
              <MatchedJobsList jobs={listJobs} />
            </div>

            {/* Empty State */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchedJobsPage;