// src/types/saveJob.ts
import { Job } from './job';

export interface SaveJob {
  id: string;
  user_id: string;
  job_data: Job;
  job_id: string;
  job_title: string;
  company_name?: string;
  location?: string;
  category?: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  contract_time?: string;
  is_active: boolean;
  notes?: string;
  tags?: string[];
  priority: 1 | 2 | 3;
  created_at: string;
  updated_at: string;
}