// pages/saved/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import SaveJobCard from '@/components/SaveJobCard';
import { SavedJob } from '@/types/saveJob';
import { supabase } from '../../lib/supabaseClient';

type FilterType = 'all' | 'saved' | 'applied' | 'rejected' | 'interviewed' | 'offered';
type SortType = 'newest' | 'oldest' | 'title' | 'company';

export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    saved: 0,
    applied: 0,
    rejected: 0,
    interviewed: 0,
    offered: 0,
    byLocation: {}
  });

  // Filter state
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Initial load
  useEffect(() => {
    fetchSavedJobs();
  }, []);

  // Apply filters when state changes
  useEffect(() => {
    applyFilters();
  }, [savedJobs, filter, sort, searchQuery, selectedLocation]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);

      // Fetch saved jobs from Supabase - table name: saved_jobs
      const { data: savedJobsData, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved jobs:', error);
        throw error;
      }

      console.log('Fetched saved jobs:', savedJobsData);
      setSavedJobs(savedJobsData || []);
      calculateStats(savedJobsData || []);

    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      setSavedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (jobs: SavedJob[]) => {
    const stats = {
      total: jobs.length,
      saved: jobs.filter(job => job.status === 'saved').length,
      applied: jobs.filter(job => job.status === 'applied').length,
      rejected: jobs.filter(job => job.status === 'rejected').length,
      interviewed: jobs.filter(job => job.status === 'interviewed').length,
      offered: jobs.filter(job => job.status === 'offered').length,
      byLocation: {} as Record<string, number>
    };

    // Calculate location distribution
    jobs.forEach(job => {
      const location = job.location || 'Unknown';
      stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
    });

    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...savedJobs];

    // Apply filter type
    if (filter !== 'all') {
      filtered = filtered.filter(job => job.status === filter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.job_title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.job_url && job.job_url.toLowerCase().includes(query))
      );
    }

    // Apply location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(job => job.location === selectedLocation);
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.saved_at || a.created_at || '0';
          const dateB = b.saved_at || b.created_at || '0';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.saved_at || a.created_at || '0';
          const dateB = b.saved_at || b.created_at || '0';
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
        break;
      case 'title':
        filtered.sort((a, b) => a.job_title.localeCompare(b.job_title));
        break;
      case 'company':
        filtered.sort((a, b) => a.company.localeCompare(b.company));
        break;
    }

    setFilteredJobs(filtered);
  };

  const handleDeleteSavedJob = async (jobId: number) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      // Update local state
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));

    } catch (error) {
      console.error('Error deleting saved job:', error);
    }
  };

  const handleUpdateStatus = async (jobId: number, status: SavedJob['status']) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      // Update local state
      setSavedJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, status, updated_at: new Date().toISOString() }
          : job
      ));

      // message.success(`Status updated to ${status}`);

    } catch (error) {
      console.error('Error updating status:', error);
      // message.error('Failed to update status');
    }
  };

  // Get unique locations for filters
  const locations = ['all', ...Object.keys(stats.byLocation).sort()];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
          </div>

          {/* Database Info */}

          {/* Search and Filters */}
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Saved Jobs
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by job title, company, or URL..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Location Filter */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  id="location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location === 'all' ? 'All Locations' : location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Sort Type */}

              {/* Action Buttons */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="company">Company A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading saved jobs from database...</p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-medium">{filteredJobs.length}</span> of{' '}
                    <span className="font-medium">{savedJobs.length}</span> saved jobs
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {Object.keys(stats.byLocation).length} locations •{' '}
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Saved Jobs List */}
              {filteredJobs.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No saved jobs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {savedJobs.length === 0
                      ? "You haven't saved any jobs yet. Browse jobs and save your favorites!"
                      : "No jobs match your current filters. Try adjusting your search criteria."
                    }
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/jobs')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Browse Jobs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {filteredJobs.map((savedJob) => (
                      <li key={savedJob.id}>
                        <div className="px-3 py-4 sm:px-4 sm:py-4 lg:px-6 hover:bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                              {/* Job Title */}
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-base sm:text-sm font-medium text-blue-600 truncate flex-1">
                                  <a
                                    href={savedJob.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-800 hover:underline"
                                  >
                                    {savedJob.job_title}
                                  </a>
                                </p>

                                {/* Delete Button - Mobile */}
                                <button
                                  onClick={() => handleDeleteSavedJob(savedJob.id!)}
                                  className="sm:hidden px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex-shrink-0"
                                >
                                  Delete
                                </button>
                              </div>

                              {/* Company, Location, Salary */}
                              <div className="mt-2 flex flex-col xs:flex-row flex-wrap gap-2 xs:gap-4">
                                {/* Company */}
                                <div className="flex items-center text-sm text-gray-500 min-w-0">
                                  <svg className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span className="truncate">{savedJob.company}</span>
                                </div>

                                {/* Location */}
                                <div className="flex items-center text-sm text-gray-500 min-w-0">
                                  <svg className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="truncate">{savedJob.location}</span>
                                </div>

                                {/* Salary - Conditional */}
                                {savedJob.salary_range && (
                                  <div className="flex items-center text-sm text-gray-500 min-w-0">
                                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="truncate">{savedJob.salary_range}</span>
                                  </div>
                                )}
                              </div>

                              {/* Date Saved */}
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs sm:text-sm">
                                  Saved on {new Date(savedJob.saved_at || savedJob.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Delete Button - Desktop */}
                            <div className="hidden sm:flex ml-2 flex-shrink-0">
                              <button
                                onClick={() => handleDeleteSavedJob(savedJob.id!)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 whitespace-nowrap"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}