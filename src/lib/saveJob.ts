import { supabase } from "./supabaseClient";

// lib/saveJob.ts
export interface SavedJob {
  id?: number;
  job_url: string;
  job_title: string;
  company: string;
  location: string;
  salary_range: string;
  saved_at?: string;
  user_id: string;
  status?: 'saved' | 'applied' | 'rejected' | 'interviewed' | 'offered';
}

export interface SaveJobResult {
  success: boolean;
  error?: string;
  data?: SavedJob;
  message?: string;
}

/**
 * Fungsi untuk menyimpan job ke database Supabase
 */
export async function saveJobToDatabase(jobData: SavedJob): Promise<SaveJobResult> {
  try {
    // Pastikan ada user_id
    if (!jobData.user_id) {
      return {
        success: false,
        error: 'User ID is required',
        message: 'User ID diperlukan untuk menyimpan job'
      };
    }

    // Cek apakah job sudah ada berdasarkan job_url dan user_id
    const { data: existingJob } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('job_url', jobData.job_url)
      .eq('user_id', jobData.user_id)
      .single();

    if (existingJob) {
      return {
        success: false,
        error: 'Job already saved',
        message: 'Lowongan ini sudah tersimpan sebelumnya'
      };
    }

    // Insert job ke database
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert([{
        job_url: jobData.job_url,
        job_title: jobData.job_title,
        company: jobData.company,
        location: jobData.location,
        salary_range: jobData.salary_range,
        user_id: jobData.user_id,
        status: jobData.status || 'saved'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return {
      success: true,
      data: data as SavedJob,
      message: 'Job saved successfully'
    };

  } catch (error) {
    console.error('Error saving job to database:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Gagal menyimpan lowongan ke database'
    };
  }
}

/**
 * Fungsi untuk mengambil semua saved jobs berdasarkan user_id
 */
export async function getSavedJobs(userId: string): Promise<{
  success: boolean;
  error?: string;
  data?: SavedJob[];
  message?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data as SavedJob[] || [],
      message: 'Jobs retrieved successfully'
    };

  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch saved jobs'
    };
  }
}

/**
 * Fungsi untuk menghapus saved job
 */
export async function deleteSavedJob(jobId: number, userId: string): Promise<SaveJobResult> {
  try {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Job deleted successfully'
    };

  } catch (error) {
    console.error('Error deleting saved job:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete saved job'
    };
  }
}

/**
 * Fungsi untuk update status saved job
 */
export async function updateJobStatus(
  jobId: number, 
  userId: string, 
  status: SavedJob['status'] = 'saved'
): Promise<SaveJobResult> {
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data as SavedJob,
      message: 'Job status updated successfully'
    };

  } catch (error) {
    console.error('Error updating job status:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update job status'
    };
  }
}

/**
 * Cek apakah job sudah disimpan oleh user
 */
export async function checkIfJobSaved(jobUrl: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('job_url', jobUrl)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, artinya belum disimpan
      console.error('Error checking saved job:', error);
    }

    return !!data; // Return true jika data ada (sudah disimpan)
    
  } catch (error) {
    console.error('Error checking saved job:', error);
    return false;
  }
}