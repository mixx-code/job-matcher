import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { CVFile } from "../types/supabase";
import { cvService } from "../services/cvService";

export const useCVManagement = () => {
  const [cvFile, setCvFile] = useState<CVFile | null>(null);
  const [cvText, setCvText] = useState("");
  const [loading, setLoading] = useState(false);

  const loadUserCV = async (userId: string, userEmail?: string) => {
    try {
      const data = await cvService.getUserCV(userId);
      
      if (data) {
        console.log("CV data loaded:", data);
        setCvFile(data);

        if (data.extracted_text) {
          setCvText(data.extracted_text);
        } else if (data.file_url) {
          // Gunakan placeholder untuk sementara
          const placeholderText = `${userEmail?.split("@")[0] || "User"}\n${data.file_name}\n\nCV telah diupload. Teks akan diekstraksi untuk analisis...`;
          setCvText(placeholderText);
        } else {
          const defaultText = `${userEmail?.split("@")[0] || "User"}\n${data.file_name}\n\nCV content for AI analysis...`;
          setCvText(defaultText);
        }
      }
    } catch (error: any) {
      console.log("No CV found or error:", error.message);
      if (error.message.includes("does not exist")) {
        console.log("Table 'user_cvs' mungkin belum dibuat di database");
      }
    }
  };

  const updateCVText = async (cvId: string, extractedText: string, metadata: any) => {
    try {
      const updatedCV = await cvService.updateCVWithExtractedText(cvId, extractedText, metadata);
      setCvFile(updatedCV);
      setCvText(extractedText);
      return updatedCV;
    } catch (error) {
      console.error("Error updating CV:", error);
      throw error;
    }
  };

  return {
    cvFile,
    cvText,
    loading,
    setLoading,
    loadUserCV,
    updateCVText,
    setCvFile,
    setCvText
  };
};