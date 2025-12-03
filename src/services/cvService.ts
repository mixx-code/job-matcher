// services/cvService.ts
// import { supabase } from "../lib/supabaseClient";
import { supabase } from "@/lib/supabaseClient";
import { CVFile } from "../types/supabase";

export const cvService = {
  /**
   * Load CV data for a specific user
   */
  async loadUserCV(userId: string): Promise<CVFile | null> {
    try {
      console.log(`📂 Loading CV for user: ${userId}`);
      
      const { data, error } = await supabase
        .from("user_cvs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      console.log("CV query result:", { data, error });
      console.log("CV data:", data);

      if (error) {
        console.error("❌ Error loading CV:", error);
        return null;
      }

      if (data) {
        console.log("✅ CV loaded successfully:", {
          id: data.id,
          fileName: data.file_name,
          hasExtractedText: !!data.extracted_text,
          hasFileUrl: !!data.file_url,
          file_url: data.file_url
        });
        return data;
      }

      console.log("ℹ️ No CV found for user");
      return null;
    } catch (error: any) {
      console.error("❌ Unexpected error in loadUserCV:", error);
      return null;
    }
  },

  /**
   * Get all CVs for a user (for history)
   */
  async getUserCVs(userId: string): Promise<CVFile[]> {
    try {
      const { data, error } = await supabase
        .from("user_cvs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting user CVs:", error);
      return [];
    }
  },

  /**
   * Save or update CV record
   */
  async saveCVRecord(
    userId: string,
    fileData: {
      file_name: string;
      file_url: string;
      file_size: number;
      file_type: string;
      storage_path: string;
    }
  ): Promise<CVFile> {
    try {
      const { data, error } = await supabase
        .from("user_cvs")
        .upsert({
          user_id: userId,
          ...fileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving CV record:", error);
      throw error;
    }
  },

  /**
   * Update CV with extracted text
   */
  async updateCVWithExtractedText(
    cvId: string,
    extractedText: string,
    metadata?: any
  ): Promise<CVFile> {
    try {
      const { data, error } = await supabase
        .from("user_cvs")
        .update({
          extracted_text: extractedText,
          extraction_metadata: metadata || {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", cvId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating CV with extracted text:", error);
      throw error;
    }
  },

  /**
   * Delete a CV record
   */
  async deleteCV(cvId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_cvs")
        .delete()
        .eq("id", cvId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting CV:", error);
      throw error;
    }
  }
};