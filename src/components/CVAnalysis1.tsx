"use client";
import { useState } from "react";
import type { CVAnalysis as CVAnalysisType } from "../types/cv-analysis";

interface CVAnalysisProps {
  cvText: string;
  onClose: () => void;
}

export default function CVAnalysisModalas({ cvText, onClose }: CVAnalysisProps) {
  const [analysis, setAnalysis] = useState<CVAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const analyzeCV = async () => {
    if (!cvText.trim()) {
      alert("Please upload a CV first");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setExtractionError(null);

    try {
      const response = await fetch("/api/analyze-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText: cvText,
          jobDescription: jobDescription,
        }),
      });

      const data = await response.json();

      console.log("data analisis cv: ", data);

      if (response.ok) {
        setAnalysis(data);
      } else {
        setExtractionError(data.error || "Analysis failed");
      }
    } catch (error) {
      setExtractionError("Error analyzing CV. Please try again.");
    } finally {
      setLoading(false);
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

  // Fungsi untuk menampilkan informasi pribadi
  const renderPersonalInfo = () => {
    if (!analysis?.personalInfo) return null;

    const { name, location, email, phone } = analysis.personalInfo;

    // Cek jika semua field null
    if (!name && !location && !email && !phone) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            ⓘ Informasi pribadi tidak ditemukan dalam CV. Pastikan CV berisi nama, lokasi, email, atau telepon.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-3">📋 Informasi Pribadi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {name && (
            <div className="flex items-center">
              <span className="text-blue-700 font-medium mr-2">Nama:</span>
              <span className="text-blue-900">{name}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center">
              <span className="text-blue-700 font-medium mr-2">Lokasi:</span>
              <span className="text-blue-900">{location}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center">
              <span className="text-blue-700 font-medium mr-2">Email:</span>
              <span className="text-blue-900">{email}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center">
              <span className="text-blue-700 font-medium mr-2">Telepon:</span>
              <span className="text-blue-900">{phone}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">CV Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {extractionError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{extractionError}</p>
            </div>
          )}

          {/* Job Description Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here for targeted analysis..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          </div>

          {/* CV Content Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CV Content Preview
            </label>
            <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {cvText.length > 500
                  ? `${cvText.substring(0, 500)}...`
                  : cvText || "No CV content available"}
              </pre>
            </div>
            {cvText.length > 500 && (
              <p className="text-xs text-gray-500 mt-1">
                Showing first 500 characters. Full content will be used for
                analysis.
              </p>
            )}
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={analyzeCV}
              disabled={loading || !cvText.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing CV...
                </>
              ) : (
                "Analyze CV with AI"
              )}
            </button>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              {/* Personal Info - TAMBAHKAN INI */}
              {renderPersonalInfo()}

              {/* Overall Score */}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Overall Score</h3>
                <div
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(
                    analysis.overallScore
                  )} ${getScoreColor(
                    analysis.overallScore
                  )} border-4 border-white shadow-lg`}
                >
                  <span className="text-2xl font-bold">
                    {analysis.overallScore}/100
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                <p className="text-blue-800">{analysis.summary}</p>
              </div>

              {/* Skill Match */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Skill Match</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(analysis.skillMatch).map(
                    ([category, score]) => (
                      <div key={category} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium capitalize">
                            {category}
                          </span>
                          <span className={`font-bold ${getScoreColor(score)}`}>
                            {score}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              score >= 80
                                ? "bg-green-500"
                                : score >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-600">
                    ✅ Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-yellow-600">
                    💡 Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Skills */}
              {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-600">
                    🔍 Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-600">
                  📋 Recommendations
                </h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li
                      key={index}
                      className="flex items-start p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}