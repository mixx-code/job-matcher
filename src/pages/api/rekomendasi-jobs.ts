import { NextApiRequest, NextApiResponse } from 'next';

interface AnalysisData {
    skill?: string[];
    professionalSummary?: {
        keyExpertise?: string[];
    };
    rekomendasiJobs?: string[];
    missingSkills?: string[];
    strengths?: string[];
    recommendations?: string[];
}

interface Job {
    title_jobs?: string;
    perusahaan?: string;
    lokasi?: string;
    gaji?: string;
    jobs_url?: string;
}

interface MatchedJob {
    job_title: string;
    company: string;
    location: string;
    match_score: number;
    match_reasons: string[];
    salary_range: string;
    job_url: string;
}

interface SkillMapping {
    [key: string]: string[];
}

interface ApiResponse {
    success: boolean;
    matched_jobs?: MatchedJob[];
    summary?: {
        total_analyzed: number;
        matched: number;
        best_match: string;
        message: string;
    };
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    const { hasilAnalisis, listJobs }: { hasilAnalisis: AnalysisData; listJobs: Job[] } = req.body;

    if (!hasilAnalisis || !listJobs) {
        return res.status(400).json({
            success: false,
            error: 'Data required'
        });
    }

    // Ekstrak skill dari berbagai sumber
    let candidateSkills: string[] = [
        ...(hasilAnalisis.skill || []),
        ...(hasilAnalisis.professionalSummary?.keyExpertise || []),
        ...(hasilAnalisis.rekomendasiJobs || [])
    ].map((s: string) => s.toLowerCase().trim());

    console.log("Original skills:", candidateSkills);
    
    // Skill mapping yang lebih comprehensive
    const skillMapping: SkillMapping = {
        // Programming & Development
        'python': ['backend', 'developer', 'programming', 'software'],
        'java': ['backend', 'developer', 'programming', 'software', 'spring'],
        'javascript': ['frontend', 'fullstack', 'web', 'developer', 'react', 'node'],
        'react': ['frontend', 'web', 'developer', 'ui'],
        'node': ['backend', 'javascript', 'developer'],
        'fullstack': ['developer', 'backend', 'frontend', 'web'],

        // Security
        'penetration': ['security', 'cyber', 'infosec', 'pentest', 'ethical hacking'],
        'cybersecurity': ['security', 'cyber', 'infosec', 'soc'],
        'fortigate': ['firewall', 'network security', 'security', 'network'],
        'firewall': ['security', 'network', 'cyber'],

        // IT Admin & Infrastructure
        'intune': ['admin', 'system', 'windows', 'endpoint', 'it support'],
        'azure': ['cloud', 'microsoft', 'devops', 'infrastructure'],
        'aws': ['cloud', 'devops', 'infrastructure'],
        'cloud': ['infrastructure', 'devops', 'system'],
        'network': ['admin', 'infrastructure', 'system', 'it support'],

        // Data & Analytics
        'sql': ['database', 'data', 'backend', 'analyst'],
        'tableau': ['data', 'visualization', 'bi', 'analyst', 'business intelligence'],
        'data': ['analyst', 'science', 'engineer', 'analytics'],
        'machine learning': ['ai', 'data science', 'ml', 'artificial intelligence'],
        'ml': ['machine learning', 'ai', 'data science'],
    };
    
    // Expand skills dengan mapping
    const expandedSkills: string[] = [...candidateSkills];
    candidateSkills.forEach((skill: string) => {
        // Cek exact match
        if (skill in skillMapping) {
            expandedSkills.push(...skillMapping[skill]);
        }

        // Cek partial match (kata kunci dalam skill)
        Object.keys(skillMapping).forEach((key: string) => {
            if (skill.includes(key) || key.includes(skill)) {
                expandedSkills.push(...skillMapping[key]);
            }
        });
    });
    
    // Hapus duplikat dan filter empty
    candidateSkills = [...new Set(expandedSkills)].filter(s => s && s.length > 0);
    console.log("Expanded skills:", candidateSkills);
    
    const matchedJobs: MatchedJob[] = [];
    
    // Domain mapping untuk kategori pekerjaan
    const domainKeywords: SkillMapping = {
        'developer': ['developer', 'programmer', 'engineer', 'software', 'coding'],
        'security': ['security', 'cyber', 'penetration', 'infosec', 'soc'],
        'data': ['data', 'analyst', 'analytics', 'bi', 'science'],
        'admin': ['admin', 'support', 'system', 'infrastructure', 'helpdesk'],
        'devops': ['devops', 'cloud', 'infrastructure', 'deployment'],
    };
    
    for (const job of listJobs.slice(0, 50)) { // Analisis lebih banyak job
        const title = (job.title_jobs || '').toLowerCase();
        const company = (job.perusahaan || '').toLowerCase();
        const description = `${title} ${company}`.toLowerCase();

        let score = 0;
        const reasons: string[] = [];
        
        // 1. Exact skill match di title (bobot tinggi)
        candidateSkills.forEach((skill: string) => {
            if (skill.length >= 3 && title.includes(skill)) {
                score += 30;
                reasons.push(skill);
            }
        });
        
        // 2. Partial word match
        const titleWords = title.split(/[\s\-_,.()]+/).filter(w => w.length > 2);
        candidateSkills.forEach((skill: string) => {
            if (skill.length >= 3) {
                titleWords.forEach((word: string) => {
                    if (word === skill || word.includes(skill) || skill.includes(word)) {
                        score += 20;
                        reasons.push(skill);
                    }
                });
            }
        });
        
        // 3. Domain/kategori match
        Object.entries(domainKeywords).forEach(([domain, keywords]: [string, string[]]) => {
            const titleHasKeyword = keywords.some(k => title.includes(k));
            const skillMatchesDomain = keywords.some(k =>
                candidateSkills.some(s => s.includes(k) || k.includes(s))
            );

            if (titleHasKeyword && skillMatchesDomain) {
                score += 15;
                reasons.push(domain);
            }
        });
        
        // 4. Generic tech keywords (bonus kecil)
        const techKeywords = ['it', 'tech', 'digital', 'sistem', 'information'];
        const hasTechKeyword = techKeywords.some(k => title.includes(k));
        const hasTechSkill = candidateSkills.some(s =>
            ['developer', 'programming', 'software', 'system', 'network', 'security'].some(t => s.includes(t))
        );

        if (hasTechKeyword && hasTechSkill) {
            score += 10;
        }

        // PENURUNAN THRESHOLD: dari 30 ke 15
        if (score >= 15) {
            matchedJobs.push({
                job_title: job.title_jobs || 'Tidak tersedia',
                company: job.perusahaan || 'Tidak tersedia',
                location: job.lokasi || 'Tidak tersedia',
                match_score: Math.min(score, 100),
                match_reasons: [...new Set(reasons)].slice(0, 5),
                salary_range: job.gaji || 'Tidak tersedia',
                job_url: job.jobs_url || '#'
            });
        }
    }
    
    // Sort dan ambil top jobs
    matchedJobs.sort((a, b) => b.match_score - a.match_score);
    const topJobs = matchedJobs.slice(0, 12);

    console.log(`Total matches: ${matchedJobs.length}, returning top ${topJobs.length}`);
    
    res.status(200).json({
        success: true,
        matched_jobs: topJobs,
        summary: {
            total_analyzed: Math.min(listJobs.length, 50),
            matched: topJobs.length,
            best_match: topJobs[0]?.job_title || 'Tidak ada',
            message: topJobs.length
                ? `${topJobs.length} pekerjaan cocok ditemukan`
                : 'Tidak ada pekerjaan yang cocok. Coba perluas skill atau preferensi.'
        }
    });
}