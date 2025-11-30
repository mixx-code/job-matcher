import { NextApiRequest, NextApiResponse } from 'next';
import { AnalysisService } from '../../lib/analysisService';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { analysis, userId } = req.body;

        if (!analysis || !userId) {
            return res.status(400).json({ error: 'Analysis and user ID are required' });
        }

        // 1. Dapatkan jobs dari API external
        const jobsResponse = await fetch(
            'https://jobdataapi.com/api/jobs/?country_code=ID&max_age=30&page_size=20'
        );

        if (!jobsResponse.ok) {
            throw new Error('Failed to fetch jobs from external API');
        }

        const jobsData = await jobsResponse.json();
        const jobs = jobsData.results || [];

        // 2. Analisis dan match jobs dengan CV
        const jobMatches = await analyzeJobMatches(jobs, analysis);

        // 3. Simpan job matches ke database
        const latestAnalysis = await AnalysisService.getLatestAnalysis(userId);
        if (latestAnalysis && jobMatches.length > 0) {
            await AnalysisService.saveJobMatches(userId, latestAnalysis.id, jobMatches);
        }

        res.status(200).json(jobMatches);
    } catch (error: any) {
        console.error('Job matching error:', error);
        res.status(500).json({
            error: 'Failed to find job matches',
            details: error.message
        });
    }
}

// Function untuk menganalisis job matches
async function analyzeJobMatches(jobs: any[], analysis: any): Promise<any[]> {
    const matches = [];

    for (const job of jobs) {
        const matchScore = calculateMatchScore(job, analysis);

        if (matchScore >= 60) { // Hanya simpan matches dengan score >= 60%
            const skillsMatch = findSkillsMatch(job, analysis);

            matches.push({
                jobData: job,
                matchScore,
                matchReason: generateMatchReason(matchScore, skillsMatch),
                skillsMatch,
            });
        }
    }

    // Urutkan berdasarkan match score tertinggi
    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10); // Ambil 10 terbaik
}

// Function untuk menghitung match score
function calculateMatchScore(job: any, analysis: any): number {
    let score = 0;
    const jobText = `${job.title} ${job.description}`.toLowerCase();

    // Cek skills match
    analysis.strengths.forEach((strength: string) => {
        if (jobText.includes(strength.toLowerCase())) {
            score += 10;
        }
    });

    // Cek experience level
    if (analysis.skillMatch.experience > 70) {
        score += 20;
    }

    // Cek technical skills
    if (analysis.skillMatch.technical > 70) {
        score += 15;
    }

    return Math.min(score, 100);
}

// Function untuk mencari skills yang match
function findSkillsMatch(job: any, analysis: any): string[] {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const matchedSkills = analysis.strengths.filter((skill: string) =>
        jobText.includes(skill.toLowerCase())
    );

    return matchedSkills;
}

// Function untuk generate alasan match
function generateMatchReason(score: number, skillsMatch: string[]): string {
    if (score >= 80) {
        return `Excellent match with ${skillsMatch.length} key skills`;
    } else if (score >= 60) {
        return `Good match with ${skillsMatch.length} relevant skills`;
    } else {
        return `Moderate match based on skills alignment`;
    }
}