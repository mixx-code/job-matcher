export interface CVAnalysis {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    missingSkills: string[];
    skillMatch: {
        technical: number;
        experience: number;
        education: number;
    };
    recommendations: string[];
    summary: string;
}

export interface CVUploadData {
    fileName: string;
    fileSize: number;
    textContent: string;
    uploadDate: string;
}