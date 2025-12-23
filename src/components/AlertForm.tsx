// components/AlertForm.tsx
import { useState, useEffect } from 'react';
import { AlertFormData, SearchCriteria } from '../types/alert';
import { supabase } from '../lib/supabaseClient';

interface AlertFormProps {
  onSubmit: (data: AlertFormData) => Promise<void>;
  loading: boolean;
  initialData?: AlertFormData;
  isEdit?: boolean;
}

interface FormErrors {
  name?: string;
  notificationTarget?: string;
  keywords?: string;
}

export default function AlertForm({ onSubmit, loading, initialData, isEdit = false }: AlertFormProps) {
  // Form state
  const [formData, setFormData] = useState<AlertFormData>({
    name: '',
    searchCriteria: {
      keywords: [],
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
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});


  // Initialize form with initial data
useEffect(() => {
  if (initialData) {
    // Pastikan keywords adalah array
    const normalizedData = {
      ...initialData,
      searchCriteria: {
        ...initialData.searchCriteria,
        keywords: Array.isArray(initialData.searchCriteria.keywords) 
          ? initialData.searchCriteria.keywords 
          : typeof initialData.searchCriteria.keywords === 'string'
            ? (initialData.searchCriteria.keywords as string).split(',').map(k => k.trim()).filter(k => k)
            : []
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(normalizedData);
  }
}, [initialData]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('searchCriteria.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        searchCriteria: {
          ...prev.searchCriteria,
          [field]: type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked 
            : type === 'number' 
              ? value ? parseInt(value) : undefined 
              : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : type === 'number' 
            ? value ? parseInt(value) : undefined 
            : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle keyword addition
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.searchCriteria.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        searchCriteria: {
          ...prev.searchCriteria,
          keywords: [...prev.searchCriteria.keywords, keywordInput.trim()]
        }
      }));
      setKeywordInput('');
      setErrors(prev => ({ ...prev, keywords: undefined }));
    }
  };

  // Handle keyword removal
  const handleRemoveKeyword = (keyword: string) => {
    if (!Array.isArray(formData.searchCriteria.keywords)) return;
    setFormData(prev => ({
    ...prev,
    searchCriteria: {
      ...prev.searchCriteria,
      keywords: prev.searchCriteria.keywords.filter(k => k !== keyword)
    }
  }));
  };

  // Handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate form
  const newErrors: FormErrors = {};
  
  if (!formData.name.trim()) {
    newErrors.name = 'Alert name is required';
  }
  
  if (!formData.notificationTarget.trim()) {
    newErrors.notificationTarget = 'Email or Telegram is required';
  } else if (formData.notificationMethod === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.notificationTarget)) {
      newErrors.notificationTarget = 'Please enter a valid email address';
    }
  } else if (formData.notificationMethod === 'telegram') {
    const telegramRegex = /^@[a-zA-Z0-9_]{5,}$/;
    if (!telegramRegex.test(formData.notificationTarget)) {
      newErrors.notificationTarget = 'Please enter a valid Telegram username (e.g., @username)';
    }
  }
  
  if (formData.searchCriteria.keywords.length === 0) {
    newErrors.keywords = 'At least one keyword is required';
  }
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  // HAPUS semua kode save ke Supabase di sini
  // Biarkan parent component (CreateAlertPage) yang handle save
  
  try {
    // Panggil parent onSubmit dengan formData
    await onSubmit(formData);
  } catch (error) {
    console.error('Error in form submission:', error);
    setErrors({
      ...errors,
      notificationTarget: 'Failed to submit form'
    });
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

  // Job type options
  const jobTypeOptions = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  // Experience level options
  const experienceLevelOptions = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Alert Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Alert Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
          placeholder="e.g., Senior Frontend Developer Remote"
          disabled={loading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Search Criteria Section */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Search Criteria</h3>
        
        {/* Keywords */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords *
          </label>
          <div className="flex">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., React, TypeScript, Next.js"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {errors.keywords && (
            <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
          )}
          
          {/* Keywords List */}
          {(Array.isArray(formData.searchCriteria.keywords) ? formData.searchCriteria.keywords : []).map((keyword, index) => (
  <span
    key={index}
    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
  >
    {keyword}
    <button
      type="button"
      onClick={() => handleRemoveKeyword(keyword)}
      disabled={loading}
      className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-blue-200 focus:outline-none"
    >
      <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </span>
))}
          <p className="mt-1 text-sm text-gray-500">
            Add keywords separated by comma or press Enter
          </p>
        </div>

        {/* Location and Industry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="searchCriteria.location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="searchCriteria.location"
              name="searchCriteria.location"
              value={formData.searchCriteria.location || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Jakarta, Remote, Worldwide"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="searchCriteria.industry" className="block text-sm font-medium text-gray-700">
              Industry
            </label>
            <input
              type="text"
              id="searchCriteria.industry"
              name="searchCriteria.industry"
              value={formData.searchCriteria.industry || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Technology, Finance, Healthcare"
              disabled={loading}
            />
          </div>
        </div>

        {/* Job Type and Experience Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="searchCriteria.jobType" className="block text-sm font-medium text-gray-700">
              Job Type
            </label>
            <select
              id="searchCriteria.jobType"
              name="searchCriteria.jobType"
              value={formData.searchCriteria.jobType || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={loading}
            >
              <option value="">Any Type</option>
              {jobTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="searchCriteria.experienceLevel" className="block text-sm font-medium text-gray-700">
              Experience Level
            </label>
            <select
              id="searchCriteria.experienceLevel"
              name="searchCriteria.experienceLevel"
              value={formData.searchCriteria.experienceLevel || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={loading}
            >
              <option value="">Any Level</option>
              {experienceLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Salary Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Range (IDR/month)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="searchCriteria.salaryMin" className="sr-only">
                Minimum Salary
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rp</span>
                </div>
                <input
                  type="number"
                  id="searchCriteria.salaryMin"
                  name="searchCriteria.salaryMin"
                  value={formData.searchCriteria.salaryMin || ''}
                  onChange={handleInputChange}
                  className="pl-12 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Minimum"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="searchCriteria.salaryMax" className="sr-only">
                Maximum Salary
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rp</span>
                </div>
                <input
                  type="number"
                  id="searchCriteria.salaryMax"
                  name="searchCriteria.salaryMax"
                  value={formData.searchCriteria.salaryMax || ''}
                  onChange={handleInputChange}
                  className="pl-12 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Maximum"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Remote Only Checkbox */}
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="searchCriteria.remoteOnly"
            name="searchCriteria.remoteOnly"
            checked={formData.searchCriteria.remoteOnly || false}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={loading}
          />
          <label htmlFor="searchCriteria.remoteOnly" className="ml-2 block text-sm text-gray-900">
            Remote Only
          </label>
        </div>
      </div>

      {/* Notification Settings Section */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Settings</h3>
        
        {/* Frequency */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative border rounded-lg p-4 flex cursor-pointer focus:outline-none ${formData.frequency === 'daily' ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
              <input
                type="radio"
                name="frequency"
                value="daily"
                checked={formData.frequency === 'daily'}
                onChange={handleInputChange}
                className="sr-only"
                disabled={loading}
              />
              <div className="flex items-center">
                <div className={`h-4 w-4 rounded-full border ${formData.frequency === 'daily' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {formData.frequency === 'daily' && (
                    <div className="h-2 w-2 rounded-full bg-white m-auto"></div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Daily</p>
                  <p className="text-sm text-gray-500">Get updates every day at 8 AM</p>
                </div>
              </div>
            </label>
            
            <label className={`relative border rounded-lg p-4 flex cursor-pointer focus:outline-none ${formData.frequency === 'weekly' ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
              <input
                type="radio"
                name="frequency"
                value="weekly"
                checked={formData.frequency === 'weekly'}
                onChange={handleInputChange}
                className="sr-only"
                disabled={loading}
              />
              <div className="flex items-center">
                <div className={`h-4 w-4 rounded-full border ${formData.frequency === 'weekly' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {formData.frequency === 'weekly' && (
                    <div className="h-2 w-2 rounded-full bg-white m-auto"></div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Weekly</p>
                  <p className="text-sm text-gray-500">Get updates every Monday at 8 AM</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Notification Method */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative border rounded-lg p-4 flex cursor-pointer focus:outline-none ${formData.notificationMethod === 'email' ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
              <input
                type="radio"
                name="notificationMethod"
                value="email"
                checked={formData.notificationMethod === 'email'}
                onChange={handleInputChange}
                className="sr-only"
                disabled={loading}
              />
              <div className="flex items-center">
                <div className={`h-4 w-4 rounded-full border ${formData.notificationMethod === 'email' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {formData.notificationMethod === 'email' && (
                    <div className="h-2 w-2 rounded-full bg-white m-auto"></div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-500">Send to your email address</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Notification Target */}
        <div>
          <label htmlFor="notificationTarget" className="block text-sm font-medium text-gray-700">
            {formData.notificationMethod === 'email' ? 'Email Address *' : 'Telegram Username *'}
          </label>
          <input
            type="text"
            id="notificationTarget"
            name="notificationTarget"
            value={formData.notificationTarget}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${errors.notificationTarget ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder={formData.notificationMethod === 'email' ? 'you@example.com' : '@username'}
            disabled={loading}
          />
          {errors.notificationTarget && (
            <p className="mt-1 text-sm text-red-600">{errors.notificationTarget}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.notificationMethod === 'email' 
              ? 'We\'ll send job alerts to this email address'
              : 'Make sure your Telegram username starts with @ (e.g., @yourusername)'
            }
          </p>
        </div>
      </div>

      {/* Active Status (for edit mode) */}
      {isEdit && (
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active Alert
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            When inactive, you won&quot;t receive notifications from this alert
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEdit ? 'Updating...' : 'Saving to Database...'}
              </>
            ) : (
              isEdit ? 'Update Alert' : 'Create Alert'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}