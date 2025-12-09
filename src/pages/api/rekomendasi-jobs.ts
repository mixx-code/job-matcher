import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { hasilAnalisis, listJobs } = req.body;
    if (!hasilAnalisis || !listJobs) return res.status(400).json({ error: 'Data required' });
    
    let candidateSkills = (hasilAnalisis.skill || []).map(s => s.toLowerCase());
    console.log("Original skills:", candidateSkills);
    
    // TAMBAH INI: Mapping skill spesifik ke keyword umum
    const skillMapping = {
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
    const expandedSkills = [...candidateSkills];
    candidateSkills.forEach(skill => {
        if (skillMapping[skill]) {
            expandedSkills.push(...skillMapping[skill]);
        }
    });
    
    // Hapus duplikat
    candidateSkills = [...new Set(expandedSkills)];
    console.log("Expanded skills:", candidateSkills);
    
    const matchedJobs = [];
    
    // Skill mapping untuk berbagai bidang
    const skillMap = {
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
        const reasons = [];
        
        // Cek skill langsung
        candidateSkills.forEach(skill => {
            if (title.includes(skill)) {
                score += 25;
                reasons.push(skill);
            }
        });
        
        // Cek partial match (kata dalam kata)
        candidateSkills.forEach(skill => {
            const words = title.split(/[\s\-_,.]+/);
            words.forEach(word => {
                if (word.includes(skill) || skill.includes(word)) {
                    score += 15;
                    reasons.push(skill);
                }
            });
        });
        
        // Cek bidang
        Object.entries(skillMap).forEach(([field, skills]) => {
            const hasField = skills.some(s => title.includes(s));
            const hasSkill = skills.some(s => candidateSkills.includes(s));
            if (hasField && hasSkill) {
                score += 20;
                reasons.push(field);
            }
        });
        
        if (score >= 30) { // Turunkan threshold jadi 30
            matchedJobs.push({
                job_title: job.title_jobs,
                company: job.perusahaan,
                location: job.lokasi,
                match_score: Math.min(score, 100),
                match_reasons: [...new Set(reasons)].slice(0, 3), // Hapus duplikat
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

// import { NextApiRequest, NextApiResponse } from 'next';
// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY!
// });

// export default async function handler(
//     req: NextApiRequest,
//     res: NextApiResponse
// ) {
//     if (req.method !== 'POST') {
//         return res.status(405).json({ error: 'Method not allowed' });
//     }

//     console.log('🎯 Memulai pencocokan pekerjaan...');
//     const startTime = Date.now();

//     const { hasilAnalisis, listJobs } = req.body;

//     if (!hasilAnalisis || !listJobs) {
//         console.error('❌ Data tidak lengkap');
//         return res.status(400).json({
//             success: false,
//             error: 'hasilAnalisis dan listJobs diperlukan'
//         });
//     }

//     console.log("list jobs: ", listJobs);
//     console.log('🚀 Memulai pencocokan pekerjaan...');

//     try {
//         const prompt = `
// PENCOCOKAN LOWONGAN PEKERJAAN BERDASARKAN ANALISIS CV

// **DATA ANALISIS CV:**
// ${JSON.stringify(hasilAnalisis)}

// **DATA LOWONGAN PEKERJAAN:**
// ${JSON.stringify(listJobs)}

// **INSTRUKSI ANALISIS:**
// 1. Filter semua pekerjaan dari listJobs yang relevan dengan DATA ANALISIS CV
// 2. Prioritaskan kecocokan dengan keahlian utama kandidat: ${hasilAnalisis.professionalSummary.keyExpertise.join(', ')}
// 3. Pertimbangkan rekomendasi pekerjaan dari analisis: ${hasilAnalisis.rekomendasiJobs.join(', ')}
// 4. Berikan skor kecocokan (0-100) berdasarkan:
//    - Kesesuaian judul/deskripsi pekerjaan dengan keahlian kandidat
//    - Kecocokan keterampilan yang dibutuhkan dengan yang dimiliki
//    - Level pengalaman (Entry-Level/Mid-Level)
// 5. Abaikan pekerjaan yang tidak relevan dari data analisis CV

// **FORMAT OUTPUT YANG DIHARAPKAN (HANYA JSON) DAN JAWABAN HARUS BAHASA INDONESIA:**

// {
//   "matched_jobs": [
//     {
//       "job_title": "string",
//       "company": "string",
//       "location": "string",
//       "job_description": "string (maksimal 200 karakter)",
//       "match_score": "number",
//       "match_reasons": ["string"],
//       "missing_skills": ["string"],
//       "salary_range": "string atau null",
//       "is_remote": "boolean",
//       "job_url": "string",
//       "recommended_actions": ["string"]
//     }
//   ],
//   "summary": {
//     "total_jobs_analyzed": "number",
//     "total_matched": "number",
//     "average_match_score": "number",
//     "best_match": {
//       "job_title": "string",
//       "score": "number"
//     },
//     "top_3_skills_matched": ["string"],
//     "top_3_skills_missing": ["string"],
//     "recommendation": "string"
//   },
//   "filtering_stats": {
//     "jobs_ignored": "number",
//     "ignored_categories": ["string"],
//     "ignored_locations": ["string"]
//   }
// }

// **ATURAN PENTING:**
// - GUNAKAN BAHASA INDONESIA SEBAGAI RESPONSE
// - HANYA KEMBALIKAN DATA JSON, TANPA MARKDOWN
// - JIKA TIDAK ADA PEKERJAAN YANG COCOK, KEMBALIKAN matched_jobs: []
// - UNTUK job_description, AMBIL 200 KARAKTER PERTAMA DARI FIELD description
// - HITUNG match_score BERDASARKAN:
//   * 40% kecocokan judul/deskripsi dengan keahlian kandidat
//   * 30% kecocokan keterampilan yang diminta
//   * 20% level pengalaman
//   * 10% lokasi/remote opportunity
// - UNTUK missing_skills, COMPARE DENGAN ${JSON.stringify(hasilAnalisis.missingSkills)}
// - UNTUK match_reasons, SEBUTKAN KEKUATAN KHUSUS DARI ${JSON.stringify(hasilAnalisis.strengths)} YANG RELEVAN
// - recommended_actions HARUS SPESIFIK BERDASARKAN ${JSON.stringify(hasilAnalisis.recommendations)}
// - JIKA LOWONGAN TIDAK ADA DATA salary, GUNAKAN "Informasi tidak tersedia"
// - UNTUK is_remote: true JIKA deskripsi MENGANDUNG "remote", "work from home", ATAU SEJENISNYA
// `;

//         console.log('🤖 Mengirim request ke AI...');

//         const response = await ai.models.generateContent({
//             model: "gemini-2.5-flash",
//             contents: prompt,
//             config: {
//                 temperature: 0.1,
//                 maxOutputTokens: 4000,
//             }
//         });

//         console.log('✅ Response AI diterima');

//         // Clean dan parse response
//         let matchingData;
//         let responseText = response.text.trim();

//         // Bersihkan response dari markdown code blocks
//         responseText = responseText.replace(/```json\s*|\s*```/g, '').trim();

//         try {
//             matchingData = JSON.parse(responseText);
//             console.log('✅ JSON berhasil di-parse');

//         } catch (parseError) {
//             console.error('❌ Error parsing JSON:', parseError);
//             console.log('Raw response:', responseText);
//             matchingData = createFallbackMatching(hasilAnalisis, listJobs);
//         }

//         // VALIDASI DAN CLEANUP DATA SEBELUM DIKIRIM
//         const validatedData = validateAndCleanMatchingData(matchingData, listJobs);

//         const endTime = Date.now();
//         console.log('📈 Hasil Matching:');
//         console.log('   - Total jobs analyzed:', validatedData.summary?.total_jobs_analyzed || 0);
//         console.log('   - Total matched:', validatedData.summary?.total_matched || 0);

//         res.status(200).json({
//             success: true,
//             ...validatedData,
//             analysisMetadata: {
//                 processingTime: endTime - startTime,
//                 timestamp: new Date().toISOString()
//             }
//         });

//     } catch (error: any) {
//         const endTime = Date.now();
//         console.error('❌ Job Matching error:', error);

//         const fallbackData = validateAndCleanMatchingData(
//             createFallbackMatching(hasilAnalisis, listJobs),
//             listJobs
//         );

//         res.status(500).json({
//             success: false,
//             error: 'Failed to match jobs',
//             details: error.message,
//             ...fallbackData
//         });
//     }
// }

// // Fungsi untuk validasi dan cleanup data matching
// function validateAndCleanMatchingData(data: any, listJobs: any[]): any {
//     const cleanedData = {
//         matched_jobs: Array.isArray(data.matched_jobs) ? data.matched_jobs : [],
//         summary: {
//             total_jobs_analyzed: listJobs.length || 0,
//             total_matched: Array.isArray(data.matched_jobs) ? data.matched_jobs.length : 0,
//             average_match_score: calculateAverageMatchScore(data.matched_jobs || []),
//             best_match: getBestMatch(data.matched_jobs || []),
//             top_3_skills_matched: Array.isArray(data.summary?.top_3_skills_matched) 
//                 ? data.summary.top_3_skills_matched.slice(0, 3)
//                 : [],
//             top_3_skills_missing: Array.isArray(data.summary?.top_3_skills_missing) 
//                 ? data.summary.top_3_skills_missing.slice(0, 3)
//                 : [],
//             recommendation: data.summary?.recommendation || 'Lanjutkan pengembangan keterampilan teknis dan sertifikasi.'
//         },
//         filtering_stats: {
//             jobs_ignored: listJobs.length - (Array.isArray(data.matched_jobs) ? data.matched_jobs.length : 0),
//             ignored_categories: Array.isArray(data.filtering_stats?.ignored_categories) 
//                 ? data.filtering_stats.ignored_categories
//                 : getIgnoredCategories(listJobs),
//             ignored_locations: Array.isArray(data.filtering_stats?.ignored_locations) 
//                 ? data.filtering_stats.ignored_locations
//                 : getIgnoredLocations(listJobs)
//         }
//     };

//     // Validasi dan bersihkan setiap matched job
//     cleanedData.matched_jobs = cleanedData.matched_jobs.map((job: any) => ({
//         job_title: job.job_title || 'Judul tidak tersedia',
//         company: job.company || 'Perusahaan tidak tersedia',
//         location: job.location || 'Lokasi tidak tersedia',
//         job_description: truncateString(job.job_description || '', 200),
//         match_score: validateNumber(job.match_score, 0, 100, 50),
//         match_reasons: Array.isArray(job.match_reasons) ? job.match_reasons.filter((r: any) => r) : [],
//         missing_skills: Array.isArray(job.missing_skills) ? job.missing_skills.filter((s: any) => s) : [],
//         salary_range: job.salary_range || 'Informasi tidak tersedia',
//         is_remote: Boolean(job.is_remote),
//         job_url: job.job_url || '#',
//         recommended_actions: Array.isArray(job.recommended_actions) 
//             ? job.recommended_actions.filter((a: any) => a)
//             : []
//     }));

//     // Urutkan berdasarkan match_score tertinggi
//     cleanedData.matched_jobs.sort((a: any, b: any) => b.match_score - a.match_score);

//     return cleanedData;
// }

// // Fungsi untuk create fallback matching
// function createFallbackMatching(hasilAnalisis: any, listJobs: any[]): any {
//     console.log('🔄 Menggunakan fallback matching...');
    
//     const relevantJobs = filterRelevantJobsManually(hasilAnalisis, listJobs);
    
//     return {
//         matched_jobs: relevantJobs,
//         summary: {
//             total_jobs_analyzed: listJobs.length,
//             total_matched: relevantJobs.length,
//             average_match_score: relevantJobs.length > 0 
//                 ? relevantJobs.reduce((acc, job) => acc + job.match_score, 0) / relevantJobs.length
//                 : 0,
//             best_match: relevantJobs.length > 0 
//                 ? { job_title: relevantJobs[0].job_title, score: relevantJobs[0].match_score }
//                 : { job_title: null, score: 0 },
//             top_3_skills_matched: hasilAnalisis.professionalSummary.keyExpertise.slice(0, 3),
//             top_3_skills_missing: hasilAnalisis.missingSkills.slice(0, 3),
//             recommendation: 'Tidak ada pekerjaan IT yang relevan ditemukan. Coba cari di platform lain.'
//         },
//         filtering_stats: {
//             jobs_ignored: listJobs.length - relevantJobs.length,
//             ignored_categories: getIgnoredCategories(listJobs),
//             ignored_locations: getIgnoredLocations(listJobs)
//         }
//     };
// }

// // Fungsi untuk filter job secara manual
// function filterRelevantJobsManually(hasilAnalisis: any, listJobs: any[]): any[] {
//     const relevantKeywords = [
//         ...hasilAnalisis.professionalSummary.keyExpertise,
//         ...hasilAnalisis.rekomendasiJobs,
//         'security', 'data', 'engineer', 'infrastructure', 'cloud', 'network',
//         'penetration', 'vulnerability', 'machine learning', 'it', 'technology'
//     ];

//     const relevantJobs = [];
    
//     for (const job of listJobs) {
//         const title = (job.title || '').toLowerCase();
//         const description = (job.description || '').toLowerCase();
        
//         // Cek apakah job IT-related
//         const isITJob = relevantKeywords.some(keyword => 
//             title.includes(keyword.toLowerCase()) || 
//             description.includes(keyword.toLowerCase())
//         );

//         if (isITJob) {
//             const matchScore = calculateManualMatchScore(job, hasilAnalisis);
            
//             if (matchScore > 30) { // Threshold minimal
//                 relevantJobs.push({
//                     job_title: job.title || 'IT Job',
//                     company: job.company?.display_name || 'Unknown Company',
//                     location: job.location?.display_name || 'Unknown Location',
//                     job_description: truncateString(job.description || '', 200),
//                     match_score: matchScore,
//                     match_reasons: [
//                         'Judul pekerjaan sesuai dengan bidang IT',
//                         'Memerlukan keterampilan teknis'
//                     ],
//                     missing_skills: hasilAnalisis.missingSkills.slice(0, 3),
//                     salary_range: job.salary_min && job.salary_max 
//                         ? `£${job.salary_min} - £${job.salary_max}`
//                         : 'Informasi tidak tersedia',
//                     is_remote: description.includes('remote') || description.includes('work from home'),
//                     job_url: job.redirect_url || '#',
//                     recommended_actions: hasilAnalisis.recommendations.slice(0, 3)
//                 });
//             }
//         }
//     }

//     return relevantJobs;
// }

// // Fungsi untuk menghitung match score secara manual
// function calculateManualMatchScore(job: any, hasilAnalisis: any): number {
//     let score = 0;
//     const title = (job.title || '').toLowerCase();
//     const description = (job.description || '').toLowerCase();
    
//     // Cek kecocokan dengan keahlian kandidat
//     hasilAnalisis.professionalSummary.keyExpertise.forEach((skill: string) => {
//         if (description.includes(skill.toLowerCase())) {
//             score += 10;
//         }
//     });
    
//     // Cek kecocokan dengan rekomendasi pekerjaan
//     hasilAnalisis.rekomendasiJobs.forEach((recommendedJob: string) => {
//         if (title.includes(recommendedJob.toLowerCase())) {
//             score += 15;
//         }
//     });
    
//     // Remote work bonus
//     if (description.includes('remote') || description.includes('work from home')) {
//         score += 5;
//     }
    
//     return Math.min(score, 100);
// }

// // Fungsi helper
// function calculateAverageMatchScore(matchedJobs: any[]): number {
//     if (matchedJobs.length === 0) return 0;
//     const total = matchedJobs.reduce((acc, job) => acc + (job.match_score || 0), 0);
//     return Math.round(total / matchedJobs.length);
// }

// function getBestMatch(matchedJobs: any[]): { job_title: string | null, score: number } {
//     if (matchedJobs.length === 0) {
//         return { job_title: null, score: 0 };
//     }
    
//     const bestJob = matchedJobs.reduce((best, current) => 
//         (current.match_score || 0) > (best.match_score || 0) ? current : best
//     );
    
//     return { 
//         job_title: bestJob.job_title || null, 
//         score: bestJob.match_score || 0 
//     };
// }

// function getIgnoredCategories(listJobs: any[]): string[] {
//     const categories = new Set<string>();
    
//     listJobs.forEach(job => {
//         if (job.category?.label) {
//             categories.add(job.category.label);
//         }
//     });
    
//     return Array.from(categories);
// }

// function getIgnoredLocations(listJobs: any[]): string[] {
//     const locations = new Set<string>();
    
//     listJobs.forEach(job => {
//         if (job.location?.display_name) {
//             locations.add(job.location.display_name);
//         }
//     });
    
//     return Array.from(locations);
// }

// function truncateString(str: string, maxLength: number): string {
//     if (str.length <= maxLength) return str;
//     return str.substring(0, maxLength) + '...';
// }

// function validateNumber(value: any, min: number, max: number, defaultValue: number): number {
//     const num = Number(value);
//     if (isNaN(num)) return defaultValue;
//     return Math.min(Math.max(num, min), max);
// }