// src/services/saveJobService.ts

import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/supabase';
import { Job } from '../types/job';

// Gunakan tipe dari Supabase
type SaveJob = Database['public']['Tables']['save_jobs']['Row'];
type SaveJobInsert = Database['public']['Tables']['save_jobs']['Insert'];
type SaveJobUpdate = Database['public']['Tables']['save_jobs']['Update'];

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

      // Prepare job data sesuai dengan struktur save_jobs table
      const saveJobData: SaveJobInsert = {
        user_id: user.id,
        job_id: job.id.toString(),
        job_title: job.title || 'Untitled Job',
        job_data: JSON.parse(JSON.stringify(job)), // Convert to plain object compatible with Json type
        company_name: job.company || null,
        location: job.location || null,
        category: job.category || null,
        salary_min: job.salary_min || null,
        salary_max: job.salary_max || null,
        contract_type: job.contract_type || null,
        contract_time: job.contract_time || null,
        is_active: true,
        notes: null,
        tags: null,
        priority: 3
      };

      // Insert to database
      const { data, error } = await supabase
        .from('save_jobs')
        .insert(saveJobData)
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
  async updateSavedJob(jobId: string, updates: SaveJobUpdate): Promise<SaveJob | null> {
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
  async updatePriority(jobId: string, priority: number): Promise<SaveJob | null> {
    return this.updateSavedJob(jobId, { priority });
  }

  // Toggle active status
  async toggleActive(jobId: string, currentStatus: boolean): Promise<SaveJob | null> {
    return this.updateSavedJob(jobId, { is_active: !currentStatus });
  }
}

export const saveJobService = new SaveJobService();

// Export tipe untuk digunakan di tempat lain
export type { SaveJob, SaveJobInsert, SaveJobUpdate };