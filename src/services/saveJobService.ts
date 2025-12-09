// src/services/saveJobService.ts

import { supabase } from '@/lib/supabaseClient';
import { Job } from '../types/job';
import { SaveJob } from '../types/saveJob';

interface SaveJobData {
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
}

class SaveJobService {
  // Save job ke database
  async saveJob(job: Job): Promise<SaveJob | null> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        throw new Error('Please login to save jobs');
      }

      // Prepare job data
      const saveJobData: SaveJobData = {
        job_data: job,
        job_id: job.id.toString(),
        job_title: job.title,
        company_name: job.company || undefined,
        location: job.location || undefined,
        category: job.category || undefined,
        salary_min: job.salary_min || undefined,
        salary_max: job.salary_max || undefined,
        contract_type: job.contract_type || undefined,
        contract_time: job.contract_time || undefined,
      };

      // Insert to database
      const { data, error } = await supabase
        .from('save_jobs')
        .insert({
          user_id: user.id,
          ...saveJobData,
          is_active: true,
          notes: '',
          tags: [],
          priority: 3
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate error
        if (error.code === '23505') {
          throw new Error('Job already saved');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  }

  // Check if job is already saved
  async isJobSaved(jobId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { data, error } = await supabase
        .from('save_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', jobId.toString())
        .maybeSingle();

      if (error) {
        console.error('Error checking saved job:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isJobSaved:', error);
      return false;
    }
  }

  // Get user's saved jobs
  async getSavedJobs(): Promise<SaveJob[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from('save_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      return [];
    }
  }

  // Delete saved job
  async deleteSavedJob(jobId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('save_jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting saved job:', error);
      throw error;
    }
  }

  // Update saved job fields
  async updateSavedJob(jobId: string, updates: Partial<SaveJob>): Promise<SaveJob | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('save_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating saved job:', error);
      throw error;
    }
  }

  // Update notes
  async updateNotes(jobId: string, notes: string): Promise<SaveJob | null> {
    return this.updateSavedJob(jobId, { notes });
  }

  // Update tags
  async updateTags(jobId: string, tags: string[]): Promise<SaveJob | null> {
    return this.updateSavedJob(jobId, { tags });
  }

  // Update priority
  async updatePriority(jobId: string, priority: 1 | 2 | 3): Promise<SaveJob | null> {
    return this.updateSavedJob(jobId, { priority });
  }

  // Toggle active status
  async toggleActive(jobId: string, currentStatus: boolean): Promise<SaveJob | null> {
    return this.updateSavedJob(jobId, { is_active: !currentStatus });
  }
}

export const saveJobService = new SaveJobService();