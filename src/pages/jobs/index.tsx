// pages/jobs/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Job, JobStats } from '../../types/job';
import JobFilters from '@/components/JobFilters';
import CardJobs from '@/components/CardJobs';



const JOBS_PER_PAGE = 20;
const APP_ID = process.env.NEXT_PUBLIC_ADZUNA_APP_ID;
const APP_KEY = process.env.NEXT_PUBLIC_ADZUNA_APP_KEY;

// Format jobs dari API response
const formatJobs = (data: any): Job[] => {
  return data.results.map((job: any) => ({
    // Informasi dasar
    id: job.id,
    title: job.title,
    company: job.company?.display_name || "Unknown Company",

    // Kategori dan jenis pekerjaan
    category: job.category?.label || "Uncategorized",
    category_tag: job.category?.tag || "",
    contract_type: job.contract_type,
    contract_time: job.contract_time,

    // Lokasi
    location: job.location?.display_name || "Location not specified",
    area: job.location?.area || [],
    latitude: job.latitude,
    longitude: job.longitude,

    // Gaji
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_is_predicted: job.salary_is_predicted === "1",
    salary_range:
      job.salary_min === job.salary_max
        ? `£${job.salary_min?.toLocaleString() || 'N/A'}`
        : `£${job.salary_min?.toLocaleString() || 'N/A'} - £${job.salary_max?.toLocaleString() || 'N/A'}`,

    // Deskripsi dan detail
    description: job.description,
    created_date: job.created,
    redirect_url: job.redirect_url,
    adref: job.adref,

    // Metadata tambahan untuk filtering
    is_full_time: job.contract_time === "full_time",
    is_permanent: job.contract_type === "permanent",
    has_salary: !!(job.salary_min || job.salary_max),

    // Format tanggal
    created_formatted: new Date(job.created).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),

    // Jarak waktu posting
    days_ago: Math.floor(
      (new Date().getTime() - new Date(job.created).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    fullTime: 0,
    partTime: 0,
    permanent: 0,
    contract: 0,
    withSalary: 0,
    recent: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    contract_type: '',
    contract_time: '',
    salary_min: '',
    salary_max: '',
    search_query: '',
  });

  // Initial load
  useEffect(() => {
    loadJobs();
  }, [currentPage]);

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      // Build API URL with filters
      let url = `https://api.adzuna.com/v1/api/jobs/gb/search/${currentPage}?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=${JOBS_PER_PAGE}`;
      
      // Add location filter if set
      if (filters.location) {
        url += `&where=${encodeURIComponent(filters.location)}`;
      } else {
        url += '&where=uk'; // Default to UK
      }
      
      // Add category filter if set
      if (filters.category) {
        url += `&category=${encodeURIComponent(filters.category)}`;
      }
      
      // Add contract type filter if set
      if (filters.contract_type) {
        url += `&contract_type=${encodeURIComponent(filters.contract_type)}`;
      }
      
      // Add contract time filter if set
      if (filters.contract_time) {
        url += `&contract_time=${encodeURIComponent(filters.contract_time)}`;
      }
      
      // Add salary filters if set
      if (filters.salary_min) {
        url += `&salary_min=${encodeURIComponent(filters.salary_min)}`;
      }
      if (filters.salary_max) {
        url += `&salary_max=${encodeURIComponent(filters.salary_max)}`;
      }
      
      // Add search query if set
      if (filters.search_query) {
        url += `&what=${encodeURIComponent(filters.search_query)}`;
      }

      console.log('Fetching jobs from:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Format data
      const formattedJobs = formatJobs(data);

      // Update state
      setJobs(formattedJobs);
      setTotalJobs(data.count || 0);
      
      // Calculate stats
      calculateStats(formattedJobs);

      console.log(`✅ Loaded ${formattedJobs.length} formatted jobs from API`);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setJobs([]);
      setFilteredJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (jobsList: Job[]) => {
    const stats: JobStats = {
      total: jobsList.length,
      fullTime: jobsList.filter(job => job.is_full_time).length,
      partTime: jobsList.filter(job => !job.is_full_time).length,
      permanent: jobsList.filter(job => job.is_permanent).length,
      contract: jobsList.filter(job => !job.is_permanent).length,
      withSalary: jobsList.filter(job => job.has_salary).length,
      recent: jobsList.filter(job => job.days_ago <= 7).length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Apply search query filter
    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(job => 
        job.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Apply contract type filter
    if (filters.contract_type) {
      filtered = filtered.filter(job => 
        job.contract_type === filters.contract_type
      );
    }

    // Apply contract time filter
    if (filters.contract_time) {
      filtered = filtered.filter(job => 
        job.contract_time === filters.contract_time
      );
    }

    // Apply salary filters
    if (filters.salary_min) {
      const minSalary = parseInt(filters.salary_min);
      filtered = filtered.filter(job => 
        job.salary_min >= minSalary
      );
    }

    if (filters.salary_max) {
      const maxSalary = parseInt(filters.salary_max);
      filtered = filtered.filter(job => 
        job.salary_max <= maxSalary
      );
    }

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to page 1 when applying new filters
    loadJobs();
  };

  const handleResetFilters = () => {
    setFilters({
      location: '',
      category: '',
      contract_type: '',
      contract_time: '',
      salary_min: '',
      salary_max: '',
      search_query: '',
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Browse thousands of job opportunities from Adzuna API
            </p>
          </div>

          {/* API Info */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Connected to Adzuna API</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Live job data powered by Adzuna API. Data updates in real-time.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Jobs</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">{stats.fullTime}</div>
                <div className="text-sm text-gray-600">Full Time</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">{stats.partTime}</div>
                <div className="text-sm text-gray-600">Part Time</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-purple-600">{stats.permanent}</div>
                <div className="text-sm text-gray-600">Permanent</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-yellow-600">{stats.contract}</div>
                <div className="text-sm text-gray-600">Contract</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-indigo-600">{stats.withSalary}</div>
                <div className="text-sm text-gray-600">With Salary</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">{stats.recent}</div>
                <div className="text-sm text-gray-600">Recent (7d)</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex">
              <input
                type="text"
                value={filters.search_query}
                onChange={(e) => handleFilterChange('search_query', e.target.value)}
                placeholder="Search jobs by title, company, or keywords..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
              />
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 bg-white rounded-lg shadow">
            <JobFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              {/* <LoadingSpinner size="large" /> */}
              <p className="mt-4 text-gray-600">Loading jobs from Adzuna API...</p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-medium">{filteredJobs.length}</span> of{' '}
                    <span className="font-medium">{totalJobs.toLocaleString()}</span> jobs
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </div>
              </div>

              {/* Jobs List */}
              {filteredJobs.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters or search terms.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {filteredJobs.map((job) => (
                      <li key={job.id}>
                        <CardJobs job={job} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}

          {/* API Documentation */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">About Adzuna API</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                This page displays real-time job listings from the Adzuna API. Adzuna aggregates job 
                postings from thousands of sources across the UK.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">API Features:</h4>
                  <ul className="space-y-1">
                    <li>• Real-time job data</li>
                    <li>• Comprehensive job details</li>
                    <li>• Salary information</li>
                    <li>• Location-based filtering</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Data Updates:</h4>
                  <ul className="space-y-1">
                    <li>• Jobs are updated in real-time</li>
                    <li>• New postings added continuously</li>
                    <li>• Historical data available</li>
                    <li>• Multiple data sources</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}