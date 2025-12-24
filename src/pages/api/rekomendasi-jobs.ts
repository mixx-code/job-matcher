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

    let candidateSkills: string[] = (hasilAnalisis.skill || []).map((s: string) => s.toLowerCase());
    console.log("Original skills:", candidateSkills);
    
    // Mapping skill spesifik ke keyword umum
    const skillMapping: SkillMapping = {
        'penetration': ['security', 'cyber', 'hacking', 'pentest'],
        'machine': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
        'fortigate': ['firewall', 'network security', 'security'],
        'intune': ['microsoft', 'system admin', 'windows', 'endpoint'],
        'cybersecurity': ['security', 'cyber', 'infosec'],
        'azure': ['cloud', 'microsoft cloud', 'cloud computing'],
        'tableau': ['data visualization', 'bi', 'business intelligence'],
        'sql': ['database', 'data', 'query']
    };
    
    // Tambahkan keyword umum untuk skill spesifik
    const expandedSkills: string[] = [...candidateSkills];
    candidateSkills.forEach((skill: string) => {
        if (skill in skillMapping) {
            expandedSkills.push(...skillMapping[skill]);
        }
    });
    
    // Hapus duplikat
    candidateSkills = [...new Set(expandedSkills)];
    console.log("Expanded skills:", candidateSkills);
    
    const matchedJobs: MatchedJob[] = [];
    
    // Skill mapping untuk berbagai bidang
    const skillMap: SkillMapping = {
        'it': ['python', 'java', 'developer', 'software', 'programming', 'backend', 'frontend'],
        'cyber': ['security', 'cyber', 'penetration', 'fortigate', 'firewall', 'soc', 'infosec'],
        'data': ['sql', 'tableau', 'data', 'analytics', 'database', 'bi', 'analysis'],
        'admin': ['admin', 'office', 'excel', 'word', 'secretary', 'assistant'],
        'finance': ['accounting', 'finance', 'tax', 'audit', 'keuangan'],
        'cloud': ['azure', 'cloud', 'aws', 'google cloud', 'devops']
    };
    
    for (const job of listJobs.slice(0, 30)) {
        const title = (job.title_jobs || '').toLowerCase();
        let score = 0;
        const reasons: string[] = [];
        
        // Cek skill langsung
        candidateSkills.forEach((skill: string) => {
            if (title.includes(skill)) {
                score += 25;
                reasons.push(skill);
            }
        });
        
        // Cek partial match (kata dalam kata)
        candidateSkills.forEach((skill: string) => {
            const words = title.split(/[\s\-_,.]+/);
            words.forEach((word: string) => {
                if (word.includes(skill) || skill.includes(word)) {
                    score += 15;
                    reasons.push(skill);
                }
            });
        });
        
        // Cek bidang
        Object.entries(skillMap).forEach(([field, skills]: [string, string[]]) => {
            const hasField = skills.some((s: string) => title.includes(s));
            const hasSkill = skills.some((s: string) => candidateSkills.includes(s));
            if (hasField && hasSkill) {
                score += 20;
                reasons.push(field);
            }
        });
        
        if (score >= 30) {
            matchedJobs.push({
                job_title: job.title_jobs || 'Tidak tersedia',
                company: job.perusahaan || 'Tidak tersedia',
                location: job.lokasi || 'Tidak tersedia',
                match_score: Math.min(score, 100),
                match_reasons: [...new Set(reasons)].slice(0, 3),
                salary_range: job.gaji || 'Tidak tersedia',
                job_url: job.jobs_url || '#'
            });
        }
    }
    
    // Hasil akhir
    matchedJobs.sort((a, b) => b.match_score - a.match_score);
    const topJobs = matchedJobs.slice(0, 8);
    
    res.status(200).json({
        success: true,
        matched_jobs: topJobs,
        summary: {
            total_analyzed: listJobs.length,
            matched: topJobs.length,
            best_match: topJobs[0]?.job_title || 'Tidak ada',
            message: topJobs.length ? `${topJobs.length} pekerjaan cocok ditemukan` : 'Tidak ada yang cocok'
        }
    });
}