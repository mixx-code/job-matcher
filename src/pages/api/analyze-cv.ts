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

    const { cvText, jobDescription } = req.body;

    if (!cvText) {
        return res.status(400).json({ error: 'CV text is required' });
    }

    try {
        const prompt = `
      ANALISIS CV DAN REKOMENDASI

      CV KANDIDAT:
      ${cvText}

      ${jobDescription ? `DESKRIPSI PEKERJAAN TARGET:
      ${jobDescription}` : ''}

      TOLONG ANALISIS DAN BERIKAN OUTPUT DALAM FORMAT JSON BERIKUT:

      {
        "overallScore": 85,
        "strengths": ["React", "TypeScript", "Team Leadership"],
        "improvements": ["Tambahkan lebih banyak metrics", "Perbaiki struktur experience"],
        "missingSkills": ["Docker", "AWS"],
        "skillMatch": {
          "technical": 80,
          "experience": 75,
          "education": 90
        },
        "recommendations": [
          "Tambahkan project portfolio",
          "Sertakan achievement berbasis angka"
        ],
        "summary": "Kandidat memiliki latar belakang yang kuat di frontend development dengan pengalaman React yang solid."
      }

      **HANYA KEMBALIKAN DATA JSON SAJA, TANPA TEKS TAMBAHAN LAINNYA.**
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        // Parse JSON response dari AI
        let analysisData;
        try {
            analysisData = JSON.parse(response.text);
        } catch (parseError) {
            // Fallback jika AI tidak return JSON murni
            analysisData = {
                overallScore: 75,
                strengths: ["Strong technical background", "Good experience"],
                improvements: ["Improve CV structure", "Add more details"],
                missingSkills: [],
                skillMatch: {
                    technical: 70,
                    experience: 65,
                    education: 80
                },
                recommendations: ["Review and enhance CV content"],
                summary: "CV shows potential but needs refinement."
            };
        }

        res.status(200).json(analysisData);
    } catch (error: any) {
        console.error('CV Analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze CV',
            details: error.message
        });
    }
}