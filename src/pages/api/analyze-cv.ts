import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('🎯 Memulai analisis CV...');
    const startTime = Date.now();

    const { cvText } = req.body;

    if (!cvText) {
        console.error('❌ CV text is required');
        return res.status(400).json({
            success: false,
            error: 'CV text is required'
        });
    }

    try {
        const prompt = `
ANALISIS CV PROFESIONAL - UNTUK SEMUA BIDANG PEKERJAAN

**DATA CV KANDIDAT:**
${cvText}


**INSTRUKSI ANALISIS:**
1. Analisis CV ini secara objektif untuk berbagai bidang pekerjaan
2. Identifikasi bidang keahlian utama kandidat
3. Ekstrak informasi personal yang jelas tercantum
4. Evaluasi berdasarkan standar CV profesional
5. Berikan rekomendasi yang relevan untuk meningkatkan CV

**FORMAT OUTPUT YANG DIHARAPKAN (HANYA JSON) DAN JAWABAN HARUS BAHASA INDONESIA:**

{
    "personalInfo": {
        "name": null,
        "location": null,
        "email": null,
        "phone": null
    },
    "professionalSummary": {
        "field": "Tidak dapat ditentukan - CV kosong",
        "experienceLevel": "tidak dapat dievaluasi",
        "keyExpertise": []
    },
    "overallScore": 0,
    "strengths": [],
    "improvements": [
        "CV tidak berisi informasi apa pun",
        "Perlu menambahkan data pendidikan, pengalaman kerja, dan keterampilan",
        "Perlu mencantumkan informasi kontak dasar (nama, email, telepon)",
        "Perlu menyertakan deskripsi profil atau tujuan karir"
    ],
    "missingSkills": [],
    "missingElements": [
        "Informasi pribadi",
        "Ringkasan profil atau tujuan karir",
        "Pengalaman kerja",
        "Pendidikan",
        "Keterampilan teknis dan non-teknis",
        "Sertifikasi atau pelatihan",
        "Proyek atau portofolio",
        "Bahasa yang dikuasai"
    ],
    "skillMatch": {
        "technical": 0,
        "experience": 0,
        "education": 0,
        "presentation": 0
    },
    "recommendations": [
        "Lengkapi CV dengan data pribadi dasar (nama, kontak, lokasi)",
        "Tambahkan ringkasan profesional yang menjelaskan bidang minat dan keahlian",
        "Daftarkan pengalaman kerja yang relevan (jika ada)",
        "Sertakan latar belakang pendidikan",
        "Tambahkan daftar keterampilan teknis dan tools yang dikuasai",
        "Sertakan proyek atau portofolio untuk mendemonstrasikan kemampuan",
        "Tentukan bidang karir yang dituju untuk penyesuaian CV yang lebih tepat"
    ],
    "summary": "CV yang diberikan kosong/tidak berisi data. Tidak dapat dilakukan analisis bidang keahlian, tingkat pengalaman, atau rekomendasi pekerjaan yang spesifik. Pengguna perlu melengkapi CV dengan informasi dasar terlebih dahulu sebelum dapat dianalisis untuk kesesuaian dengan posisi pekerjaan tertentu.",
    "rekomendasiJobs": []
}

**ATURAN PENTING:**
- GUNAKAN BAHASA INDONESIA SEBAGAI RESPONSE
- HANYA KEMBALIKAN DATA JSON, TANPA MARKDOWN
- PASTIKAN SEMUA FIELD DI ATAS ADA DALAM RESPONSE
- UNTUK missingSkills, BERIKAN ARRAY SKILL YANG DIRASA KURANG UNTUK BIDANG TERSEBUT
- JIKA TIDAK ADA MISSING SKILLS, GUNAKAN ARRAY KOSONG []
- JANGAN GUNAKAN null UNTUK ARRAY, SELALU GUNAKAN []
`;

        console.log('🤖 Mengirim request ke AI...');

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                temperature: 0.1,
                maxOutputTokens: 2000,
            }
        });

        console.log('✅ Response AI diterima');

        // Clean dan parse response
        let analysisData;
        let responseText = response.text.trim();

        // Bersihkan response dari markdown code blocks
        responseText = responseText.replace(/```json\s*|\s*```/g, '').trim();

        try {
            analysisData = JSON.parse(responseText);
            console.log('✅ JSON berhasil di-parse');

        } catch (parseError) {
            console.error('❌ Error parsing JSON:', parseError);
            analysisData = createFallbackAnalysis(cvText);
        }

        // VALIDASI DAN CLEANUP DATA SEBELUM DIKIRIM
        const validatedData = validateAndCleanAnalysisData(analysisData);

        const endTime = Date.now();
        console.log('📈 Hasil Analisis Akhir:');
        console.log('   - Overall Score:', validatedData.overallScore);
        console.log('   - Missing Skills:', validatedData.missingSkills?.length || 0, 'item');

        res.status(200).json({
            success: true,
            ...validatedData,
            analysisMetadata: {
                processingTime: endTime - startTime,
                cvLength: cvText.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        const endTime = Date.now();
        console.error('❌ CV Analysis error:', error);

        const fallbackData = validateAndCleanAnalysisData(createFallbackAnalysis(cvText));

        res.status(500).json({
            success: false,
            error: 'Failed to analyze CV',
            details: error.message,
            ...fallbackData
        });
    }
}

// Fungsi untuk validasi dan cleanup data analysis
function validateAndCleanAnalysisData(data: any): any {
    const cleanedData = {
        personalInfo: {
            name: data.personalInfo?.name || null,
            location: data.personalInfo?.location || null,
            email: data.personalInfo?.email || null,
            phone: data.personalInfo?.phone || null
        },
        professionalSummary: {
            field: data.professionalSummary?.field || 'General',
            experienceLevel: data.professionalSummary?.experienceLevel || 'Junior',
            keyExpertise: Array.isArray(data.professionalSummary?.keyExpertise)
                ? data.professionalSummary.keyExpertise
                : []
        },
        overallScore: typeof data.overallScore === 'number' ? data.overallScore : 70,
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [], // PASTIKAN INI ARRAY
        missingElements: Array.isArray(data.missingElements) ? data.missingElements : [],
        skillMatch: {
            technical: typeof data.skillMatch?.technical === 'number' ? data.skillMatch.technical : 70,
            experience: typeof data.skillMatch?.experience === 'number' ? data.skillMatch.experience : 65,
            education: typeof data.skillMatch?.education === 'number' ? data.skillMatch.education : 75,
            presentation: typeof data.skillMatch?.presentation === 'number' ? data.skillMatch.presentation : 60
        },
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        rekomendasiJobs: Array.isArray(data.rekomendasiJobs) ? data.rekomendasiJobs : [],
        summary: data.summary || 'Analisis CV menunjukkan potensi yang dapat dikembangkan lebih lanjut.'
    };

    // Validasi tambahan untuk memastikan tidak ada null di array
    cleanedData.missingSkills = cleanedData.missingSkills.filter((skill: any) => skill != null);
    cleanedData.strengths = cleanedData.strengths.filter((strength: any) => strength != null);
    cleanedData.improvements = cleanedData.improvements.filter((improvement: any) => improvement != null);
    cleanedData.recommendations = cleanedData.recommendations.filter((rec: any) => rec != null);

    console.log('🧹 Data setelah validasi:', {
        missingSkills: cleanedData.missingSkills,
        strengths: cleanedData.strengths.length,
        improvements: cleanedData.improvements.length
    });

    return cleanedData;
}

// Fungsi untuk create fallback analysis
function createFallbackAnalysis(cvText: string): any {
    const extractedInfo = extractInfoManually(cvText);
    const professionalSummary = analyzeProfessionalField(cvText);

    return {
        personalInfo: extractedInfo,
        professionalSummary: professionalSummary,
        overallScore: 70,
        strengths: ["Latar belakang pendidikan jelas", "Pengalaman kerja tercantum"],
        improvements: ["Perbaiki struktur CV", "Tambahkan pencapaian yang terukur"],
        missingSkills: [], // PASTIKAN ADA DAN KOSONG
        missingElements: ["Summary profesional", "Pencapaian kuantitatif"],
        skillMatch: {
            technical: 70,
            experience: 65,
            education: 75,
            presentation: 60
        },
        recommendations: [
            "Sertakan pencapaian yang dapat diukur dengan angka",
            "Tambahkan ringkasan profil profesional di bagian atas",
            "Perbaiki tata letak dan konsistensi format"
        ],
        rekomendasiJobs: [],
        summary: "CV menunjukkan potensi dengan informasi dasar yang cukup. Beberapa elemen dapat ditingkatkan untuk membuat CV lebih impactful."
    };
}

// Fungsi untuk extract info manually dari CV text
function extractInfoManually(cvText: string): any {
    const personalInfo = {
        name: null,
        location: null,
        email: null,
        phone: null
    };

    // Extract name
    const nameMatch = cvText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
    console.log('nameMatch:', nameMatch);
    if (nameMatch) {
        personalInfo.name = nameMatch[1].trim();
    }

    // Extract email
    const emailMatch = cvText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
        personalInfo.email = emailMatch[1].trim();
    }

    // Extract phone number
    const phoneMatch = cvText.match(/(\d{10,15})|(\+?\d{1,4}?[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9})/);
    if (phoneMatch) {
        personalInfo.phone = phoneMatch[0].trim().replace(/\s+/g, '');
    }

    // Extract location
    const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Yogyakarta',
        'Malang', 'Denpasar', 'Makassar', 'Palembang', 'Tangerang', 'Bekasi',
        'Depok', 'Bogor', 'Tangsel', 'Tangerang Selatan'];
    for (const city of cities) {
        if (cvText.includes(city)) {
            personalInfo.location = city;
            break;
        }
    }

    return personalInfo;
}

// Fungsi untuk menganalisis bidang profesional dari CV text
function analyzeProfessionalField(cvText: string): any {
    const textLower = cvText.toLowerCase();

    const fieldKeywords = {
        'Software Development': ['programmer', 'developer', 'software', 'coding', 'programming', 'react', 'java', 'python', 'javascript'],
        'IT & Technology': ['it', 'teknologi', 'system', 'network', 'database', 'server', 'cloud'],
        'Marketing & Sales': ['marketing', 'sales', 'promosi', 'iklan', 'brand', 'customer'],
        'Finance & Accounting': ['finance', 'akuntansi', 'accounting', 'keuangan', 'audit'],
        'Human Resources': ['hr', 'human resources', 'recruitment', 'rekrutmen'],
        'Design & Creative': ['design', 'desain', 'creative', 'graphic', 'ui', 'ux'],
        'Operations & Management': ['operation', 'manajemen', 'management', 'operasional'],
        'General': []
    };

    let detectedField = 'General';
    let maxMatches = 0;

    for (const [field, keywords] of Object.entries(fieldKeywords)) {
        const matches = keywords.filter(keyword => textLower.includes(keyword)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedField = field;
        }
    }

    let experienceLevel = 'Fresh Graduate';
    if (textLower.includes('senior') || textLower.includes('lead') || textLower.includes('manajer')) {
        experienceLevel = 'Senior';
    } else if (textLower.includes('mid') || textLower.match(/\d+\+?\s*tahun/)) {
        experienceLevel = 'Mid-Level';
    }

    const keyExpertise = [];
    const allKeywords = Object.values(fieldKeywords).flat();
    for (const keyword of allKeywords) {
        if (textLower.includes(keyword) && !keyExpertise.includes(keyword)) {
            keyExpertise.push(keyword);
            if (keyExpertise.length >= 5) break;
        }
    }

    return {
        field: detectedField,
        experienceLevel: experienceLevel,
        keyExpertise: keyExpertise.slice(0, 5)
    };
}