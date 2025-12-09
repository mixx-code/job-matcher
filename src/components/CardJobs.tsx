// src/components/CardJobs.tsx
import { useState, useEffect } from 'react';
import { Job } from '../types/job';
import { saveJobService } from '../services/saveJobService';
import { useAuth } from '../contexts/AuthContext'; // Asumsi ada AuthContext

interface JobCardProps {
  job: Job;
  onSaveSuccess?: (jobId: string) => void;
  onSaveError?: (error: Error) => void;
}

export default function CardJobs({ job, onSaveSuccess, onSaveError }: JobCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth(); // Menggunakan AuthContext

  const getContractTypeBadge = () => {
    const colors = {
      'full_time': 'bg-green-100 text-green-800 border border-green-200',
      'part_time': 'bg-blue-100 text-blue-800 border border-blue-200',
      'contract': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'permanent': 'bg-purple-100 text-purple-800 border border-purple-200',
    };
    
    const type = job.contract_time || job.contract_type;
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getDaysAgoBadge = () => {
    if (job.days_ago === 0) return 'bg-red-100 text-red-800 border border-red-200';
    if (job.days_ago <= 3) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if (job.days_ago <= 7) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Check if job is already saved on component mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (user) {
        try {
          const saved = await saveJobService.isJobSaved(job.id.toString());
          setIsSaved(saved);
        } catch (error) {
          console.error('Error checking saved status:', error);
        }
      }
    };
    
    checkSavedStatus();
  }, [job.id, user]);

  const handleSaveJob = async () => {
    // Check if user is logged in
    if (!user) {
      onSaveError?.(new Error('Please login to save jobs'));
      return;
    }

    // Prevent multiple clicks
    if (isSaving) return;

    setIsSaving(true);
    try {
      const result = await saveJobService.saveJob(job);
      setIsSaved(true);
      onSaveSuccess?.(job.id.toString());
      
      // Show success message
      alert('✅ Job saved successfully! You can view it in your Saved Jobs page.');
    } catch (error: any) {
      setIsSaved(false);
      
      if (error.message === 'Job already saved') {
        alert('ℹ️ This job has already been saved.');
        setIsSaved(true);
      } else if (error.message === 'Please login to save jobs') {
        alert('🔒 Please login to save jobs');
        onSaveError?.(error);
      } else {
        console.error('Error saving job:', error);
        alert('❌ Failed to save job. Please try again.');
        onSaveError?.(error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewSavedJobs = () => {
    // Redirect to saved jobs page
    window.location.href = '/saved-jobs';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          {/* Job Title and Company */}
          <div className="mb-3">
            <h3 className="text-xl font-semibold text-gray-900">
              <a 
                href={job.redirect_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-700 transition-colors"
              >
                {job.title}
              </a>
            </h3>
            <p className="text-lg text-gray-700 font-medium">{job.company}</p>
          </div>

          {/* Location and Category */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {job.location}
              </div>
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
                {job.category}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getContractTypeBadge()}`}>
              {job.contract_time ? 
                job.contract_time.replace('_', ' ').toUpperCase() : 
                job.contract_type?.toUpperCase() || 'CONTRACT'}
            </span>
            
            {job.salary_min && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                £{job.salary_min.toLocaleString()} - £{job.salary_max?.toLocaleString()}
              </span>
            )}
            
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getDaysAgoBadge()}`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {job.days_ago === 0 ? 'TODAY' : job.days_ago === 1 ? '1 DAY AGO' : `${job.days_ago} DAYS AGO`}
            </span>
          </div>

          {/* Description Preview */}
          <div className="mt-3">
            <p className="text-gray-700 line-clamp-3">
              {job.description.replace(/<[^>]*>/g, '')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 lg:mt-0 lg:ml-6 lg:flex-shrink-0">
          <div className="flex flex-col space-y-3 min-w-[140px]">
            <a
              href={job.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center items-center px-4 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              View Job
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            
            <button
              onClick={handleSaveJob}
              disabled={isSaving || isSaved}
              className={`inline-flex justify-center items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                isSaved 
                  ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed hover:bg-green-100' 
                  : isSaving
                  ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Saved ✓
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save Job
                </>
              )}
            </button>

            {isSaved && (
              <button
                onClick={handleViewSavedJobs}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-center"
              >
                View Saved Jobs →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posted Date */}
      <div className="mt-5 pt-4 border-t border-gray-200 text-sm text-gray-500">
        Posted on {job.created_formatted}
      </div>
    </div>
  );
}