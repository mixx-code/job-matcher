interface QuickStatsProps {
  stats?: {
    jobAlerts: number;
    applications: number;
    cvScore: number;
  };
}

export default function QuickStats({
  stats = { jobAlerts: 3, applications: 12, cvScore: 85 },
}: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <div className="text-2xl font-bold text-blue-600">
          {stats.jobAlerts}
        </div>
        <div className="text-gray-600">Job Alerts</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <div className="text-2xl font-bold text-green-600">
          {stats.applications}
        </div>
        <div className="text-gray-600">Applications</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <div className="text-2xl font-bold text-purple-600">
          {stats.cvScore}%
        </div>
        <div className="text-gray-600">CV Score</div>
      </div>
    </div>
  );
}
