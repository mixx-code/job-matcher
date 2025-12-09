// types/job.ts
export interface Job {
  // Informasi dasar
  id: string;
  title: string;
  company: string;
  
  // Kategori dan jenis pekerjaan
  category: string;
  category_tag: string;
  contract_type: string;
  contract_time: string;
  
  // Lokasi
  location: string;
  area: string[];
  latitude: number;
  longitude: number;
  
  // Gaji
  salary_min: number;
  salary_max: number;
  salary_is_predicted: boolean;
  salary_range: string;
  
  // Deskripsi dan detail
  description: string;
  created_date: string;
  redirect_url: string;
  adref: string;
  
  // Metadata tambahan untuk filtering
  is_full_time: boolean;
  is_permanent: boolean;
  has_salary: boolean;
  
  // Format tanggal
  created_formatted: string;
  days_ago: number;
}

export interface ApiResponse {
  results: Job[];
  count: number;
  mean: number;
}

export interface FilterOptions {
  location?: string;
  category?: string;
  contract_type?: string;
  contract_time?: string;
  salary_min?: number;
  salary_max?: number;
  search_query?: string;
}

export interface JobStats {
  total: number;
  fullTime: number;
  partTime: number;
  permanent: number;
  contract: number;
  withSalary: number;
  recent: number; // jobs posted within last 7 days
}