// types/alert.ts
export interface SearchCriteria {
  keywords: string[];
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'remote' | 'hybrid';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  industry?: string;
  remoteOnly?: boolean;
}

export interface Alert {
  id: string;
  user_id: string;
  name: string;
  search_criteria: SearchCriteria;
  frequency: 'daily' | 'weekly';
  notification_method: 'email' | 'telegram';
  notification_target: string;
  is_active: boolean;
  last_sent?: string;
  next_run?: string;
  match_count: number;
  created_at: string;
  updated_at: string;
}

export interface AlertFormData {
  name: string;
  searchCriteria: SearchCriteria;
  frequency: 'daily' | 'weekly';
  notificationMethod: 'email' | 'telegram';
  notificationTarget: string;
  isActive: boolean;
}

export interface AlertResponse {
  success: boolean;
  data?: Alert | Alert[];
  message?: string;
  error?: string;
}