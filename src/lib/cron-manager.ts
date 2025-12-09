// lib/cron-manager.ts
import { CronJob } from 'cron';
import { supabaseCron } from './supabase-server-cron';

// Types for alerts (sesuai dengan struktur data yang diberikan)
interface Alert {
  id: string;
  name: string | null;
  frequency: string | null;
  search_criteria: any;
  status: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  last_processed?: string | null;
  is_active?: boolean;
  next_run?: string | null;
  notification_method?: string;
  notification_target?: string;
  last_sent?: string | null;
  match_count?: number;
}

interface CronStatus {
  running: boolean;
  lastExecution?: Date;
  totalRuns: number;
  lastError?: string;
}

class CronManager {
  private static instance: CronManager;
  private job: CronJob | null = null;
  private status: CronStatus = {
    running: false,
    totalRuns: 0,
  };
  private lastExecutionTime: Date | null = null;

  private constructor() {}

  public static getInstance(): CronManager {
    if (!CronManager.instance) {
      CronManager.instance = new CronManager();
    }
    return CronManager.instance;
  }

  public getStatus(): CronStatus {
    return {
      ...this.status,
      lastExecution: this.lastExecutionTime || undefined,
      lastError: this.status.lastError
    };
  }

  public async executeNow(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Manual execution triggered');
      await this.execute();
      return {
        success: true,
        message: 'Manual execution completed'
      };
    } catch (error: any) {
      console.error('Manual execution failed:', error);
      return {
        success: false,
        message: `Manual execution failed: ${error.message}`
      };
    }
  }

  public getNextExecution(): Date | null {
    if (!this.job || !this.job.running) {
      return null;
    }
    return this.job.nextDate().toDate();
  }

  public async start(): Promise<{ success: boolean; message: string }> {
    if (this.job?.running) {
      return { 
        success: false, 
        message: 'Cron job is already running' 
      };
    }

    try {
      this.job = new CronJob(
        '*/30 * * * * *', // Every 30 seconds
        this.execute.bind(this),
        null,
        true,
        'Asia/Jakarta'
      );

      this.status.running = true;
      console.log('✅ Cron job started');
      console.log('⏰ Next execution:', this.getNextExecution()?.toISOString());
      
      return { 
        success: true, 
        message: 'Cron job started successfully' 
      };

    } catch (error: any) {
      console.error('❌ Failed to start cron job:', error);
      this.status.lastError = error.message;
      return { 
        success: false, 
        message: `Failed to start: ${error.message}` 
      };
    }
  }

  public stop(): { success: boolean; message: string } {
    if (!this.job || !this.job.running) {
      return { 
        success: false, 
        message: 'Cron job is not running' 
      };
    }

    try {
      this.job.stop();
      this.status.running = false;
      console.log('🛑 Cron job stopped');
      
      return { 
        success: true, 
        message: 'Cron job stopped successfully' 
      };

    } catch (error: any) {
      console.error('❌ Failed to stop cron job:', error);
      this.status.lastError = error.message;
      return { 
        success: false, 
        message: `Failed to stop: ${error.message}` 
      };
    }
  }

  private async execute(): Promise<void> {
    const executionId = Date.now();
    const startTime = Date.now();
    this.status.totalRuns++;
    this.lastExecutionTime = new Date();
    
    console.log(`\n🔄 [${this.lastExecutionTime.toISOString()}] Cron execution #${this.status.totalRuns} (ID: ${executionId})`);
    console.log('='.repeat(60));

    try {
      // Test 1: Check jika service role key terkonfigurasi
      console.log('\n🔐 Checking service role configuration...');
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      }
      console.log('✅ Service role key is configured');

      // Test 2: Test koneksi dasar dengan Supabase
      console.log('\n🔗 Testing Supabase connection...');
      const { data: testData, error: testError } = await supabaseCron
        .from('alerts')
        .select('id')
        .limit(1);

      if (testError) {
        // Check jika ini error RLS/policy
        if (testError.message.includes('policy') || testError.message.includes('RLS') || testError.code === '42501') {
          console.log('🚨 RLS POLICY ERROR DETECTED!');
          console.log('Error details:', {
            message: testError.message,
            code: testError.code,
            details: testError.details,
            hint: testError.hint
          });
          
          console.log('\n📋 SOLUTIONS:');
          console.log('1. Disable RLS temporarily for development:');
          console.log('   ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;');
          console.log('\n2. Or create policy for service role:');
          console.log(`
            CREATE POLICY "Allow service role full access" ON alerts
            FOR ALL USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
          `);
          
          throw new Error(`RLS blocking access: ${testError.message}`);
        }
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      
      console.log('✅ Supabase connected successfully');

      // Test 3: Check jumlah data
      console.log('\n📊 Counting alerts in database...');
      const { count, error: countError } = await supabaseCron
        .from('alerts')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Count error:', countError.message);
        // Lanjutkan meski error count
        console.log('⚠️ Continuing without count...');
      } else {
        console.log(`📈 Total alerts in database: ${count || 0}`);
      }

      // Test 4: Fetch data alerts
      console.log('\n🔍 Fetching active alerts...');
      const { data: alerts, error: fetchError } = await supabaseCron
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError.message);
        throw new Error(`Failed to fetch alerts: ${fetchError.message}`);
      }

      if (!alerts || alerts.length === 0) {
        console.log('📭 No active alerts found');
        console.log('\n💡 TIPS:');
        console.log('- Make sure alerts have is_active = true');
        console.log('- Check if data exists in Supabase Table Editor');
        console.log('- Verify the user_id matches the data you showed earlier');
        return;
      }

      console.log(`✅ Found ${alerts.length} active alerts`);
      
      // Log detail alerts
      this.logAlertsDetails(alerts);

      // Process alerts
      await this.processAlerts(alerts);

      // Clear any previous errors
      this.status.lastError = undefined;

      const duration = Date.now() - startTime;
      console.log(`\n⏱️ Execution completed in ${duration}ms`);
      console.log('='.repeat(60));

    } catch (error: any) {
      console.error('\n💥 Cron execution failed:', error.message);
      console.error('Error stack:', error.stack);
      this.status.lastError = error.message;
      
      // Log environment info untuk debugging
      console.log('\n🔧 Environment Info:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
      console.log('- Service Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
  }

  private logAlertsDetails(alerts: Alert[]): void {
    console.log('\n📋 Alert Details:');
    console.log('='.repeat(60));
    
    alerts.forEach((alert, index) => {
      console.log(`\n${index + 1}. ${alert.name || 'Unnamed Alert'}`);
      console.log(`   ID: ${alert.id}`);
      console.log(`   User ID: ${alert.user_id}`);
      console.log(`   Frequency: ${alert.frequency}`);
      console.log(`   Status: ${alert.status}`);
      console.log(`   Is Active: ${alert.is_active}`);
      console.log(`   Created: ${new Date(alert.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(alert.updated_at).toLocaleString()}`);
      
      if (alert.next_run) {
        console.log(`   Next Run: ${new Date(alert.next_run).toLocaleString()}`);
      }
      
      if (alert.last_sent) {
        console.log(`   Last Sent: ${new Date(alert.last_sent).toLocaleString()}`);
      }
      
      if (alert.match_count !== undefined) {
        console.log(`   Match Count: ${alert.match_count}`);
      }
      
      // Parse and log search criteria
      this.logSearchCriteria(alert);
      
      // Log notification info
      if (alert.notification_method && alert.notification_target) {
        console.log(`   Notification: ${alert.notification_method} → ${alert.notification_target}`);
      }
    });
    
    console.log('='.repeat(60));
  }

  private logSearchCriteria(alert: Alert): void {
    try {
      let searchCriteria = alert.search_criteria;
      
      // Handle stringified JSON
      if (typeof searchCriteria === 'string') {
        searchCriteria = JSON.parse(searchCriteria);
      }
      
      if (searchCriteria && typeof searchCriteria === 'object') {
        console.log(`   Search Criteria:`);
        
        if (searchCriteria.industry !== undefined && searchCriteria.industry !== '') {
          console.log(`     Industry: ${searchCriteria.industry}`);
        }
        
        if (searchCriteria.keywords && Array.isArray(searchCriteria.keywords)) {
          console.log(`     Keywords: ${searchCriteria.keywords.join(', ')}`);
        }
        
        if (searchCriteria.location !== undefined && searchCriteria.location !== '') {
          console.log(`     Location: ${searchCriteria.location}`);
        }
        
        if (searchCriteria.remoteOnly !== undefined) {
          console.log(`     Remote Only: ${searchCriteria.remoteOnly}`);
        }
      } else if (searchCriteria) {
        console.log(`   Search Criteria: ${typeof searchCriteria}`);
      }
    } catch (error: any) {
      console.log(`   Search Criteria: Error parsing - ${error.message}`);
    }
  }

  private async processAlerts(alerts: Alert[]): Promise<void> {
    console.log('\n⚙️ Processing alerts...');
    
    for (const [index, alert] of alerts.entries()) {
      try {
        console.log(`\n🔍 [${index + 1}/${alerts.length}] Processing: ${alert.name || alert.id.substring(0, 8)}`);
        
        // Parse search criteria
        const searchCriteria = this.parseSearchCriteria(alert.search_criteria);
        
        if (!searchCriteria || !searchCriteria.keywords || !Array.isArray(searchCriteria.keywords)) {
          console.log('   ⚠️ No valid keywords found in search criteria');
          continue;
        }
        
        console.log(`   Keywords: ${searchCriteria.keywords.join(', ')}`);
        
        // Search for jobs based on criteria
        const jobs = await this.searchJobs(searchCriteria);
        
        // Update alert with results
        await this.updateAlertResults(alert, jobs.length, jobs);
        
        // Send notification if there are matches
        if (jobs.length > 0) {
          await this.sendNotification(alert, jobs);
        }
        
        // Add small delay between processing alerts to avoid rate limiting
        if (index < alerts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error: any) {
        console.error(`   ❌ Error processing alert: ${error.message}`);
      }
    }
    
    console.log('\n✅ All alerts processed');
  }

  private parseSearchCriteria(searchCriteria: any): any | null {
    try {
      if (!searchCriteria) return null;
      
      if (typeof searchCriteria === 'string') {
        return JSON.parse(searchCriteria);
      }
      
      return searchCriteria;
    } catch (error: any) {
      console.error(`   ❌ Failed to parse search_criteria: ${error.message}`);
      return null;
    }
  }

 private async searchJobs(searchCriteria: any): Promise<any[]> {
  try {
    if (!searchCriteria.keywords || !Array.isArray(searchCriteria.keywords) || searchCriteria.keywords.length === 0) {
      return [];
    }

    // 1. Ambil data jobs dari database terlebih dahulu
    const possibleJobTables = ['jobs', 'job_listings', 'job_postings', 'vacancies', 'careers'];
    let allJobs: any[] = [];

    // Coba semua tabel yang mungkin
    for (const tableName of possibleJobTables) {
      try {
        const { data: jobs, error } = await supabaseCron
          .from(tableName)
          .select('*')
          .limit(30); // Ambil 30 jobs terbaru untuk dianalisis

        if (error) {
          if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
            // Table not found, try next one
            continue;
          }
          console.error(`   ⚠️ Error searching ${tableName}: ${error.message}`);
          continue;
        }

        if (jobs && jobs.length > 0) {
          console.log(`   ✅ Found ${jobs.length} jobs in ${tableName} table`);
          allJobs = jobs;
          break; // Stop setelah menemukan tabel yang valid
        }
      } catch (error) {
        console.log(`   ℹ️ Table ${tableName} not available`);
        continue;
      }
    }

    if (allJobs.length === 0) {
      console.log('   ℹ️ No jobs found in any table');
      return [];
    }

    // 2. Panggil API rekomendasi-jobs
    console.log('   📊 Calling recommendation API...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/rekomendasi-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hasilAnalisis: {
            skill: searchCriteria.keywords
          },
          listJobs: allJobs
        }),
      });

      if (!response.ok) {
        console.error(`   ❌ API call failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const result = await response.json();
      
      if (result.success && result.matched_jobs && result.matched_jobs.length > 0) {
        console.log(`   ✅ Found ${result.matched_jobs.length} matching jobs via API`);
        console.log(`   📋 Summary: ${result.summary.message}`);
        return result.matched_jobs;
      } else {
        console.log(`   ℹ️ API found no matches: ${result.summary?.message || 'No matches'}`);
        return [];
      }
      
    } catch (apiError: any) {
      console.error(`   ❌ API call error: ${apiError.message}`);
      
      // Fallback: Jika API gagal, gunakan pencarian sederhana
      console.log('   🔄 Using fallback search...');
      const matchedJobs = this.fallbackSearch(searchCriteria.keywords, allJobs);
      
      if (matchedJobs.length > 0) {
        console.log(`   ✅ Found ${matchedJobs.length} jobs via fallback`);
        return matchedJobs;
      }
      
      return [];
    }

  } catch (error: any) {
    console.error(`   ❌ Job search failed: ${error.message}`);
    return [];
  }
}

// Metode fallback jika API tidak tersedia
private fallbackSearch(keywords: string[], jobs: any[]): any[] {
  const matchedJobs: any[] = [];
  
  for (const job of jobs) {
    const title = (job.title_jobs || job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    
    let matchCount = 0;
    const matchedKeywords: string[] = [];
    
    // Cek setiap keyword
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (title.includes(lowerKeyword) || description.includes(lowerKeyword)) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }
    
    // Jika ada minimal 1 keyword yang match
    if (matchCount > 0) {
      matchedJobs.push({
        job_title: job.title_jobs || job.title || 'No Title',
        company: job.perusahaan || job.company || 'Unknown',
        location: job.lokasi || job.location || 'Unknown',
        match_score: Math.min(matchCount * 20, 100),
        match_reasons: matchedKeywords.slice(0, 3),
        salary_range: job.gaji || job.salary_range || 'Tidak tersedia',
        job_url: job.jobs_url || job.url || '#'
      });
    }
  }
  
  // Urutkan berdasarkan score tertinggi
  matchedJobs.sort((a, b) => b.match_score - a.match_score);
  console.log("matchedJobs", matchedJobs)
  
  // Return maksimal 8 jobs
  return matchedJobs.slice(0, 8);
}

  private async updateAlertResults(alert: Alert, matchCount: number, jobs?: any[]): Promise<void> {
    try {
      const updateData: any = {
        match_count: matchCount,
        updated_at: new Date().toISOString()
      };
      
      if (matchCount > 0) {
        updateData.last_sent = new Date().toISOString();
        
        // Store job matches if needed
        if (jobs && jobs.length > 0) {
          // You could create a job_matches table here
          console.log(`   📝 Storing ${jobs.length} job matches`);
        }
      }
      
      const { error } = await supabaseCron
        .from('alerts')
        .update(updateData)
        .eq('id', alert.id);
      
      if (error) {
        console.error(`   ❌ Failed to update alert: ${error.message}`);
      } else {
        console.log(`   ✅ Updated match_count to ${matchCount}`);
      }
    } catch (error: any) {
      console.error(`   ❌ Update failed: ${error.message}`);
    }
  }

  private async sendNotification(alert: Alert, jobs: any[]): Promise<void> {
    console.log(`   📧 Preparing notification for ${alert.name}`);
    
    if (alert.notification_target) {
      console.log(`   → Target: ${alert.notification_target}`);
      console.log(`   → Method: ${alert.notification_method || 'email'}`);
      console.log(`   → Jobs found: ${jobs.length}`);
      
      // Here you can implement notification logic
      // For now, just log what we would send
      
      try {
        // Example: Save notification to database
        const { error } = await supabaseCron
          .from('notifications')
          .insert({
            alert_id: alert.id,
            user_id: alert.user_id,
            job_count: jobs.length,
            notification_type: alert.notification_method || 'email',
            target: alert.notification_target,
            status: 'pending',
            metadata: {
              alert_name: alert.name,
              keywords: this.parseSearchCriteria(alert.search_criteria)?.keywords || []
            },
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.error(`   ❌ Failed to save notification: ${error.message}`);
        } else {
          console.log(`   ✅ Notification saved to database`);
        }
      } catch (error: any) {
        console.error(`   ❌ Notification error: ${error.message}`);
      }
    } else {
      console.log('   ⚠️ No notification target specified');
    }
  }
}

export const cronManager = CronManager.getInstance();
export default cronManager;