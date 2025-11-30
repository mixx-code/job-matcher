interface RecentActivityProps {
  activities?: Array<{
    id: number;
    type: string;
    description: string;
    color: string;
  }>;
  onStartJobSearch?: () => void;
}

export default function RecentActivity({
  activities = [
    {
      id: 1,
      type: "applied",
      description: "Applied: Frontend Developer at TechCo",
      color: "bg-blue-500",
    },
    {
      id: 2,
      type: "viewed",
      description: "Profile viewed by 3 recruiters",
      color: "bg-green-500",
    },
    {
      id: 3,
      type: "analyzed",
      description: "CV analyzed - 85% match score",
      color: "bg-purple-500",
    },
  ],
  onStartJobSearch,
}: RecentActivityProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        📋 Recent Activity
      </h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center text-gray-700">
            <span
              className={`w-2 h-2 ${activity.color} rounded-full mr-3`}
            ></span>
            {activity.description}
          </div>
        ))}
      </div>
      <button
        onClick={onStartJobSearch}
        className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
      >
        Start New Job Search
      </button>
    </div>
  );
}
