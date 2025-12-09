// components/AlertCard.tsx
import { Alert } from '../types/alert';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: Alert;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSend: (alert: Alert) => void;
}

export default function AlertCard({ alert, onToggleActive, onDelete, onEdit, onSend }: AlertCardProps) {
  const getFrequencyBadge = (frequency: string) => {
    const colors: Record<string, string> = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[frequency] || 'bg-gray-100 text-gray-800'}`}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </span>
    );
  };

  const getMethodIcon = (method: string) => {
    if (method === 'email') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  };

  const formatKeywords = (keywords: string[]) => {
    if (!keywords || keywords.length === 0) return 'Any';
    return keywords.slice(0, 3).join(', ') + (keywords.length > 3 ? '...' : '');
  };

  return (
    <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 hover:bg-gray-50 transition-colors duration-150">
  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
    {/* Main Content */}
    <div className="flex-1 min-w-0">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                  {alert.name}
                </h3>
                {!alert.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                    Paused
                  </span>
                )}
              </div>
              
              <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-2">
                {getFrequencyBadge(alert.frequency)}
                <div className="flex items-center text-sm text-gray-500">
                  {getMethodIcon(alert.notification_method)}
                  <span className="ml-1 truncate max-w-[150px] sm:max-w-none">
                    {alert.notification_target}
                  </span>
                </div>
                {alert.match_count > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                    {alert.match_count} matches
                  </span>
                )}
              </div>
            </div>
            
            {/* Toggle Switch - Mobile/Tablet */}
            <div className="xs:hidden">
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  id={`toggle-mobile-${alert.id}`}
                  checked={alert.is_active}
                  onChange={() => onToggleActive(alert.id, alert.is_active)}
                  className="sr-only"
                />
                <label
                  htmlFor={`toggle-mobile-${alert.id}`}
                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                    alert.is_active ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-300 ease-in-out ${
                      alert.is_active ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toggle Switch - Desktop */}
        <div className="hidden xs:flex ml-2 flex-shrink-0">
          <div className="relative inline-block w-10 align-middle select-none">
            <input
              type="checkbox"
              id={`toggle-desktop-${alert.id}`}
              checked={alert.is_active}
              onChange={() => onToggleActive(alert.id, alert.is_active)}
              className="sr-only"
            />
            <label
              htmlFor={`toggle-desktop-${alert.id}`}
              className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                alert.is_active ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-300 ease-in-out ${
                  alert.is_active ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </label>
          </div>
        </div>
      </div>
      
      {/* Search Criteria */}
      <div className="mt-3 sm:mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-700">
          <div className="break-words">
            <span className="font-medium">Keywords:</span>{' '}
            <span className="text-gray-600">
              {formatKeywords(alert.search_criteria.keywords || [])}
            </span>
          </div>
          {alert.search_criteria.location && (
            <div className="break-words">
              <span className="font-medium">Location:</span>{' '}
              <span className="text-gray-600">{alert.search_criteria.location}</span>
            </div>
          )}
          {alert.search_criteria.jobType && (
            <div className="break-words">
              <span className="font-medium">Job Type:</span>{' '}
              <span className="text-gray-600">
                {alert.search_criteria.jobType.replace('-', ' ')}
              </span>
            </div>
          )}
        </div>
        
        {/* Timestamps */}
        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-1 sm:gap-2">
          <span>
            Last sent: {alert.last_sent 
              ? formatDistanceToNow(new Date(alert.last_sent), { addSuffix: true })
              : 'Never'}
          </span>
          {alert.next_run && (
            <span className="hidden sm:inline">•</span>
          )}
          {alert.next_run && (
            <span>
              Next: {formatDistanceToNow(new Date(alert.next_run), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </div>
    
    {/* Action Buttons */}
    <div className="lg:ml-4 lg:flex-shrink-0">
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(alert.id)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="hidden sm:inline">Edit</span>
            <span className="sm:hidden">✏️ Edit</span>
          </button>
          <button
            onClick={() => onSend(alert)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-green-400 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-white hover:text-black"
          >
            <span className="hidden sm:inline">Test Send</span>
            <span className="sm:hidden">📤 Send</span>
          </button>
        </div>
        <button
          onClick={() => onDelete(alert.id)}
          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <span className="hidden sm:inline">Delete</span>
          <span className="sm:hidden">🗑️ Delete</span>
        </button>
      </div>
    </div>
  </div>
</div>
  );
}