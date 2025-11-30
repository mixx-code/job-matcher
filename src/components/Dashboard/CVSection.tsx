import { useState } from "react";
import { AnalysisService } from "../../lib/analysisService";
import { supabase } from "../../lib/supabaseClient";

interface CVFile {
  file_name: string;
  file_size: number;
  file_url: string;
  updated_at: string;
}

interface CVSectionProps {
  cvFile: CVFile | null;
  user: any;
  session: any; // Tambahkan session prop
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onShowAnalysis: () => void;
}

// Tambahkan interface untuk analysis results
interface AnalysisResult {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  skillMatch: Record<string, number>;
  recommendations: string[];
  summary: string;
}

export default function CVSection({
  cvFile,
  user,
  session, // Terima session sebagai prop
  onFileUpload,
  onShowAnalysis,
}: CVSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsUploading(true);
    setAnalysis(null); // Reset analysis ketika upload file baru
    setAnalysisError(null);
    await onFileUpload(event);
    setIsUploading(false);
  };

  // Function untuk mencari job matches
  const findJobMatches = async (analysisData: any) => {
    try {
      const response = await fetch("/api/find-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis: analysisData,
          userId: session.user.id,
        }),
      });

      if (response.ok) {
        const jobMatches = await response.json();
        console.log("Job matches found:", jobMatches.length);

        // Bisa tambahkan notifikasi atau update UI
        if (jobMatches.length > 0) {
          // Optional: Tampilkan notifikasi
          alert(
            `🎉 Found ${jobMatches.length} job matches! Check the Jobs section.`
          );
        }
      }
    } catch (error) {
      console.error("Error finding job matches:", error);
    }
  };

  const handleAnalyzeCV = async () => {
    if (!cvFile || !session?.user) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setAnalysisError(null);

    try {
      const cvText = `CV File: ${cvFile.file_name}\nUploaded: ${new Date(
        cvFile.updated_at
      ).toLocaleDateString()}\nSize: ${(cvFile.file_size / 1024 / 1024).toFixed(
        2
      )} MB`;

      const response = await fetch("/api/analyze-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText: cvText,
          jobDescription: "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis(data);

        // ✅ SIMPAN HASIL ANALISIS KE DATABASE
        try {
          // Dapatkan CV ID terlebih dahulu
          const { data: cvRecord, error: cvError } = await supabase
            .from("user_cvs")
            .select("id")
            .eq("file_url", cvFile.file_url)
            .single();

          if (cvError) {
            console.error("Error getting CV record:", cvError);
          } else if (cvRecord) {
            await AnalysisService.saveCVAnalysis(
              session.user.id,
              cvRecord.id,
              data
            );
            console.log("Analysis saved successfully!");

            // ✅ OTOMATIS CARI JOB MATCHES SETELAH ANALISIS
            await findJobMatches(data);
          }
        } catch (saveError) {
          console.error("Failed to save analysis:", saveError);
          // Jangan tampilkan error ke user, karena analisis tetap berhasil
        }
      } else {
        setAnalysisError(data.error || "Analysis failed");
      }
    } catch (error) {
      setAnalysisError("Error analyzing CV. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">📄 Your CV</h2>

      {cvFile ? (
        <div className="space-y-4">
          {/* File Info */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{cvFile.file_name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {(cvFile.file_size / 1024 / 1024).toFixed(2)} MB •{" "}
                  {new Date(cvFile.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(cvFile.file_url, "_blank")}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isUploading || isAnalyzing}
                >
                  View
                </button>
                <label
                  className={`px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer ${
                    isUploading || isAnalyzing
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={isUploading || isAnalyzing}
                  />
                  {isUploading ? "Uploading..." : "Re-upload"}
                </label>
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAnalyzeCV}
              disabled={isUploading || isAnalyzing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing with AI...
                </>
              ) : (
                "Analyze with AI"
              )}
            </button>
          </div>

          {/* Analysis Results */}
          {analysisError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{analysisError}</p>
            </div>
          )}

          {analysis && (
            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm space-y-6">
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  🚀 AI Analysis Results
                </h3>
                <p className="text-gray-600">Comprehensive CV assessment</p>
              </div>

              {/* Overall Score - Highlight */}
              <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Overall Score
                </h4>
                <div className="flex justify-center items-center space-x-4">
                  <div
                    className={`flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(
                      analysis.overallScore
                    )} ${getScoreColor(
                      analysis.overallScore
                    )} border-4 border-white shadow-lg`}
                  >
                    <span className="text-2xl font-bold">
                      {analysis.overallScore}
                    </span>
                  </div>
                  <div className="text-left">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(
                        analysis.overallScore
                      )}`}
                    >
                      {analysis.overallScore}/100
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {analysis.overallScore >= 80
                        ? "Excellent! 🎉"
                        : analysis.overallScore >= 60
                        ? "Good! 👍"
                        : "Needs Improvement 📈"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Executive Summary
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* Strengths & Improvements Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                    <span className="w-4 h-4 bg-green-500 rounded-full mr-2 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="flex items-start text-green-800"
                      >
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                    <span className="w-4 h-4 bg-orange-500 rounded-full mr-2 flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </span>
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li
                        key={index}
                        className="flex items-start text-orange-800"
                      >
                        <span className="text-orange-500 mr-2">•</span>
                        <span className="text-sm">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Skill Match */}
              {analysis.skillMatch &&
                Object.keys(analysis.skillMatch).length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Skill Match Analysis
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(analysis.skillMatch).map(
                        ([category, score]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between"
                          >
                            <span className="capitalize text-gray-700 font-medium min-w-[120px]">
                              {category}
                            </span>
                            <div className="flex items-center space-x-3 flex-1 max-w-md">
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    score >= 80
                                      ? "bg-green-500"
                                      : score >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${score}%` }}
                                ></div>
                              </div>
                              <span
                                className={`font-bold min-w-[40px] text-right ${getScoreColor(
                                  score
                                )}`}
                              >
                                {score}%
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Recommendations */}
              {analysis.recommendations &&
                analysis.recommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <span className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex items-center justify-center">
                        <span className="text-white text-xs">💡</span>
                      </span>
                      Actionable Recommendations
                    </h4>
                    <div className="space-y-3">
                      {analysis.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-start bg-white rounded-lg p-3 border border-blue-100"
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-blue-800 text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Missing Skills */}
              {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                    <span className="w-4 h-4 bg-red-500 rounded-full mr-2 flex items-center justify-center">
                      <span className="text-white text-xs">⚡</span>
                    </span>
                    Skills to Develop
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white border border-red-300 text-red-700 rounded-full text-sm font-medium shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <div className="text-center pt-4 border-t">
                <button
                  onClick={handleAnalyzeCV}
                  disabled={isAnalyzing}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  🔄 Re-analyze CV
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No CV uploaded yet</p>
          <label
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {isUploading ? "Uploading..." : "Upload CV"}
          </label>
          <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX (Max 5MB)</p>
        </div>
      )}
    </div>
  );
}
