export interface PersonalInfo {
    name: string | null;
    location: string | null;
    email: string | null;
    phone: string | null;
}

export interface CVAnalysis {
    personalInfo: PersonalInfo;
    overallScore: number;
    strengths: string[];
    improvements: string[];
    missingElements?: string[];
    professionalSummary?: {
        field?: string;
        experienceLevel?: string;
        keyExpertise?: string[];
    };
    skillMatch: {
        technical: number;
        experience: number;
        education: number;
    };
    recommendations: string[];
    summary: string;
}