export interface JobsResponse {
    jobs?: Job[];
    data?: Job[];
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
}

export interface Job {
    id: string | number;
    title: string;
    company: string;
    location?: string;
    [key: string]: any;
}

// 📁 utils/fetchJobs.ts
export async function fetchJobsData(): Promise<JobsResponse> {
    const url = 'https://jobdataapi.com/api/jobs/?country_code=ID&max_age=30';
    
    try {
        const response = await fetch(url);
        
        // Cek content type
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        // Jika response adalah HTML (bukan JSON)
        if (contentType && contentType.includes('text/html')) {
            const html = await response.text();
            console.error('API returned HTML instead of JSON');
            console.log('HTML snippet:', html.substring(0, 300));
            
            throw new Error('API endpoint returned HTML page. Might need authentication or API key.');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: JobsResponse = await response.json();
        return data;
        
    } catch (error) {
        console.error('Failed to fetch jobs:', error);
        
        // Return data kosong sebagai fallback
        return {
            jobs: [],
            data: [],
            total: 0,
            message: 'Using mock data due to API error'
        };
    }
}

// Versi dengan mock data untuk development
export async function fetchJobsWithMock(): Promise<JobsResponse> {
    try {
        const realData = await fetchJobsData();
        
        // Jika data kosong atau error, gunakan mock
        if (!realData || 
            (!realData.jobs && !realData.data) || 
            (Array.isArray(realData.jobs) && realData.jobs.length === 0) ||
            (Array.isArray(realData.data) && realData.data.length === 0)) {
            
            console.log('API returned empty data, using mock data');
            return getMockJobsData();
        }
        
        return realData;
    } catch (error) {
        console.log('Using mock data due to API error:', error);
        return getMockJobsData();
    }
}

// Mock data untuk development
function getMockJobsData(): JobsResponse {
    const mockJobs = [
        {
            id: 1,
            title: 'Frontend Developer',
            company: 'Tech Company Indonesia',
            location: 'Jakarta',
            salary: 'Rp 10-15 juta',
            description: 'Membuat aplikasi web dengan React/Next.js',
            posted_date: '2024-01-15',
            url: '#'
        },
        {
            id: 2,
            title: 'Backend Developer',
            company: 'Startup Fintech',
            location: 'Bandung',
            salary: 'Rp 12-18 juta',
            description: 'Membangun API dengan Node.js dan Python',
            posted_date: '2024-01-14',
            url: '#'
        },
        {
            id: 3,
            title: 'Full Stack Developer',
            company: 'E-commerce Platform',
            location: 'Remote',
            salary: 'Rp 15-20 juta',
            description: 'Mengembangkan aplikasi end-to-end',
            posted_date: '2024-01-13',
            url: '#'
        },
        {
            id: 4,
            title: 'UI/UX Designer',
            company: 'Digital Agency',
            location: 'Surabaya',
            salary: 'Rp 8-12 juta',
            description: 'Mendesain user interface dan experience',
            posted_date: '2024-01-12',
            url: '#'
        },
        {
            id: 5,
            title: 'Data Analyst',
            company: 'Healthcare Tech',
            location: 'Jakarta',
            salary: 'Rp 9-14 juta',
            description: 'Analisis data untuk insights bisnis',
            posted_date: '2024-01-11',
            url: '#'
        }
    ];
    
    return {
        jobs: mockJobs,
        data: mockJobs,
        total: mockJobs.length,
        page: 1,
        limit: 10,
        isMock: true
    };
}