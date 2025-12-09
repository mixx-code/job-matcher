// components/JobFilters.tsx
import { useState } from 'react';

interface JobFiltersProps {
  filters: {
    location: string;
    category: string;
    contract_type: string;
    contract_time: string;
    salary_min: string;
    salary_max: string;
    search_query: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const LOCATIONS = [
  'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 
  'Glasgow', 'Edinburgh', 'Bristol', 'Cardiff', 'Belfast'
];

const CATEGORIES = [
  'IT Jobs', 'Accounting & Finance Jobs', 'Engineering Jobs',
  'Healthcare & Nursing Jobs', 'Sales Jobs', 'Marketing & PR Jobs',
  'Teaching Jobs', 'Hospitality & Catering Jobs', 'Retail Jobs',
  'Customer Services Jobs'
];

const CONTRACT_TYPES = [
  'permanent', 'contract', 'temp', 'part_time', 'full_time'
];

export default function JobFilters({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters
}: JobFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            id="location"
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Locations</option>
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Contract Type */}
        <div>
          <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700 mb-1">
            Contract Type
          </label>
          <select
            id="contract_type"
            value={filters.contract_type}
            onChange={(e) => onFilterChange('contract_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Types</option>
            {CONTRACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Contract Time */}
        <div>
          <label htmlFor="contract_time" className="block text-sm font-medium text-gray-700 mb-1">
            Work Time
          </label>
          <select
            id="contract_time"
            value={filters.contract_time}
            onChange={(e) => onFilterChange('contract_time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200">
          {/* Salary Min */}
          <div>
            <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Salary (£)
            </label>
            <input
              type="number"
              id="salary_min"
              value={filters.salary_min}
              onChange={(e) => onFilterChange('salary_min', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., 30000"
            />
          </div>

          {/* Salary Max */}
          <div>
            <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Salary (£)
            </label>
            <input
              type="number"
              id="salary_max"
              value={filters.salary_max}
              onChange={(e) => onFilterChange('salary_max', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., 60000"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onResetFilters}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset Filters
        </button>
        <button
          onClick={onApplyFilters}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}