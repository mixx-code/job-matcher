// components/SaveJobCard.tsx - Versi sederhana
import { SavedJob } from '@/types/saveJob';

interface SaveJobCardProps {
  savedJob: SavedJob;
  onDelete: (id: number) => void;
  onUpdateStatus: (id: number, status: SavedJob['status']) => void;
}

const SaveJobCard: React.FC<SaveJobCardProps> = ({ savedJob, onDelete, onUpdateStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saved': return 'bg-blue-100 text-blue-800';
      case 'applied': return 'bg-green-100 text-green-800';
      case 'interviewed': return 'bg-yellow-100 text-yellow-800';
      case 'offered': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">
              <a href={savedJob.job_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                {savedJob.job_title}
              </a>
            </h3>
            <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(savedJob.status)}`}>
              {savedJob.status}
            </span>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Company:</span> {savedJob.company}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Location:</span> {savedJob.location}
            </p>
            {savedJob.salary_range && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Salary:</span> {savedJob.salary_range}
              </p>
            )}
          </div>
          
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <svg className="flex-shrink-0 mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Saved on {new Date(savedJob.saved_at).toLocaleDateString()}
          </div>
        </div>
        
        <div className="ml-4 flex flex-col space-y-2">
          <button
            onClick={() => onUpdateStatus(savedJob.id!, 
              savedJob.status === 'saved' ? 'applied' : 
              savedJob.status === 'applied' ? 'interviewed' :
              savedJob.status === 'interviewed' ? 'offered' : 'saved'
            )}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            Update Status
          </button>
          <button
            onClick={() => onDelete(savedJob.id!)}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveJobCard;