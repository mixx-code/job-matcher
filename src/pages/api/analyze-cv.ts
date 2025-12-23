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


**TUGAS ANALISIS:**
1. Analisis CV ini untuk semua bidang pekerjaan
2. Identifikasi keahlian utama dari CV
3. Ekstrak informasi personal yang tercantum
4. Evaluasi kualitas CV secara keseluruhan
5. Beri rekomendasi untuk peningkatan

**FORMAT OUTPUT (HANYA JSON - BAHASA INDONESIA):**

{
    "personalInfo": {
        "name": "nama dari CV jika ada",
        "location": "lokasi dari CV jika ada",
        "email": "email dari CV jika ada", 
        "phone": "telepon dari CV jika ada"
    },
    "professionalSummary": {
        "field": "bidang pekerjaan utama berdasarkan CV",
        "experienceLevel": "tingkat pengalaman (Fresh Graduate/Junior/Mid-Level/Senior)",
        "keyExpertise": ["keahlian", "utama", "dari", "cv"]
    },
    "overallScore": 75,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["area improvement 1", "area improvement 2"],
    "missingSkills": ["skill yang kurang", "untuk bidang tersebut"],
    "missingElements": ["elemen CV yang belum ada"],
    "skill": ["skill", "yang", "terdapat", "di", "cv", "ambil", "skill", "10", "teratas"],
    "skillMatch": {
        "technical": 80,
        "experience": 75,
        "education": 85,
        "presentation": 70
    },
    "recommendations": ["rekomendasi 1", "rekomendasi 2"],
    "summary": "Ringkasan analisis CV secara keseluruhan",
    "rekomendasiJobs": ["Posisi 1", "Posisi 2"]
}

**ATURAN:**
- RESPONSE HARUS BAHASA INDONESIA
- skill HARUS ARRAY 1 KATA (contoh: ["react", "javascript", "python"])
- missingSkills HARUS ARRAY skill yang disarankan untuk ditambahkan
- skillMatch BERI NILAI 0-100 berdasarkan:
  * technical: kualitas skill teknis (0-100)
  * experience: kualitas pengalaman kerja (0-100)  
  * education: relevansi pendidikan (0-100)
  * presentation: tata letak & penyajian CV (0-100)
- HANYA OUTPUT JSON, TIDAK ADA TEKS LAIN
- JANGAN ADA MARKDOWN, HANYA JSON MURNI
`;

        console.log('🤖 Mengirim request ke AI...');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        console.log('✅ Response AI diterima');

        // Debug: cek struktur response
        console.log('Response structure:', JSON.stringify(response, null, 2).substring(0, 1000));

        // Extract text dari response - FIX DISINI!
        let responseText = '';

        // Periksa struktur response dengan detail
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            console.log('Candidate structure:', JSON.stringify(candidate, null, 2).substring(0, 500));

            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                const part = candidate.content.parts[0];
                console.log('Part structure:', JSON.stringify(part, null, 2));

                if (part.text) {
                    responseText = part.text;
                } else {
                    console.error('No text in part:', part);
                }
            } else {
                console.error('No content.parts in candidate:', candidate.content);
            }
        } else {
            console.error('No candidates in response');
        }

        if (!responseText) {
            console.error('Failed to extract text, using fallback');
            throw new Error('Failed to extract text from AI response');
        }

        responseText = responseText.trim();
        console.log('Response text length:', responseText.length);
        console.log('Response text preview:', responseText.substring(0, 300));

        // Bersihkan response dari markdown code blocks
        responseText = responseText.replace(/```json\s*|\s*```/g, '').trim();

        // Hapus kemungkinan text non-JSON di awal/akhir
        responseText = responseText.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');

        console.log('Cleaned text preview:', responseText.substring(0, 300));

        let analysisData;
        try {
            analysisData = JSON.parse(responseText);
            console.log('✅ JSON berhasil di-parse');
        } catch (parseError: any) {
            console.error('❌ Error parsing JSON:', parseError.message);
            console.error('Problematic text:', responseText.substring(0, 500));

            // Coba bersihkan lagi dengan regex
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysisData = JSON.parse(jsonMatch[0]);
                    console.log('✅ JSON berhasil di-parse dengan regex');
                } else {
                    throw new Error('No JSON found');
                }
            } catch (secondError) {
                console.error('❌ Masih gagal parse JSON, menggunakan fallback');
                analysisData = createFallbackAnalysis(cvText);
            }
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
        console.error('❌ CV Analysis error:', error.message);
        console.error('Error stack:', error.stack);

        // Cek jika error karena quota/limit
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('limit')) {
            console.error('🚨 Gemini API limit habis!');
            console.error('🚨 Tunggu 1 menit atau cek quota di Google Cloud Console');
        }

        const fallbackData = validateAndCleanAnalysisData(createFallbackAnalysis(cvText));

        res.status(200).json({  // Tetap return 200 dengan fallback data
            success: true,
            message: 'Using fallback analysis due to API issue',
            ...fallbackData,
            analysisMetadata: {
                processingTime: endTime - startTime,
                cvLength: cvText?.length || 0,
                timestamp: new Date().toISOString(),
                note: 'Fallback data used due to API error'
            }
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
        missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
        missingElements: Array.isArray(data.missingElements) ? data.missingElements : [],
        skill: Array.isArray(data.skill) ? data.skill : [],
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
        missingSkills: [],
        missingElements: ["Summary profesional", "Pencapaian kuantitatif"],
        skill: [],
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

    if (!cvText || cvText.trim().length === 0) {
        return personalInfo;
    }

    // Extract name (cari nama di awal teks)
    const nameMatch = cvText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
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
    if (!cvText || cvText.trim().length === 0) {
        return {
            field: 'General',
            experienceLevel: 'Fresh Graduate',
            keyExpertise: []
        };
    }

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
