// src/hooks/useCVManagement.ts
import { useState } from "react";
import { cvService } from "@/services/cvService";
import type { Database } from "@/types/supabase";

type CVFile = Database['public']['Tables']['user_cvs']['Row'];

export const useCVManagement = () => {
  const [cvFile, setCvFile] = useState<CVFile | null>(null);
  const [cvText, setCvText] = useState("");
  const [loading, setLoading] = useState(false);

  const loadUserCV = async (userId: string, userEmail?: string) => {
    try {
      // GUNAKAN getUserCVs (dengan 's') karena itu yang ada di cvService.ts
      const dataArray = await cvService.getUserCVs(userId);

      // Karena getUserCVs mengembalikan array, ambil item pertama
      const data = dataArray && dataArray.length > 0 ? dataArray[0] : null;
      
      if (data) {
        console.log("CV data loaded:", data);
        setCvFile(data);

        if (data.extracted_text) {
          setCvText(data.extracted_text);
        } else if (data.file_url) {
          const placeholderText = `${userEmail?.split("@")[0] || "User"}\n${data.file_name}\n\nCV telah diupload. Teks akan diekstraksi untuk analisis...`;
          setCvText(placeholderText);
        } else {
          const defaultText = `${userEmail?.split("@")[0] || "User"}\n${data.file_name}\n\nCV content for AI analysis...`;
          setCvText(defaultText);
        }
      } else {
        console.log("No CV found for user:", userId);
        // Reset state jika tidak ada data
        setCvFile(null);
        setCvText("");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("Error loading CV:", errorMessage);
      if (errorMessage.includes("does not exist")) {
        console.log("Table 'user_cvs' mungkin belum dibuat di database");
      }
    }
  };

  const updateCVText = async (cvId: string, extractedText: string, metadata: Record<string, unknown>) => {
    try {
      const updatedCV = await cvService.updateCVWithExtractedText(cvId, extractedText, metadata);
      setCvFile(updatedCV as CVFile);
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