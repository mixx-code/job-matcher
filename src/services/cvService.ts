// services/cvService.ts
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";

// Gunakan tipe dari generated types
type CVFile = Database['public']['Tables']['user_cvs']['Row'];
type CVInsert = Database['public']['Tables']['user_cvs']['Insert'];
type CVUpdate = Database['public']['Tables']['user_cvs']['Update'];

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
        .limit(1)
        .single(); // Gunakan single() karena kita hanya butuh satu record

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - ini normal
          console.log("ℹ️ No CV found for user");
          return null;
        }
        console.error("❌ Error loading CV:", error);
        return null;
      }

      console.log("✅ CV loaded successfully:", {
        id: data?.id,
        fileName: data?.file_name,
        hasExtractedText: !!data?.extracted_text,
        hasFileUrl: !!data?.file_url,
        file_url: data?.file_url
      });

      return data;
    } catch (error: unknown) {
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

      if (error) {
        console.error("Error getting user CVs:", error);
        return [];
      }

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
      // Pertama, cek apakah sudah ada CV untuk user ini
      const existingCV = await this.loadUserCV(userId);

      const cvData: CVInsert = {
        user_id: userId,
        ...fileData,
        extracted_text: null,
        extraction_metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let result;

      if (existingCV?.id) {
        // Jika sudah ada, update
        const updateData: CVUpdate = {
          ...fileData,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("user_cvs")
          .update(updateData)
          .eq("id", existingCV.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Jika belum ada, insert baru
        const { data, error } = await supabase
          .from("user_cvs")
          .insert(cvData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error: unknown) {
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
    metadata?: Record<string, unknown>
  ): Promise<CVFile> {
    try {
      const updateData: CVUpdate = {
        extracted_text: extractedText,
        extraction_metadata: metadata as any || undefined,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_cvs")
        .update(updateData)
        .eq("id", cvId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error("Error deleting CV:", error);
      throw error;
    }
  },

  /**
   * Upload CV file to storage and save record
   */
  async uploadCV(userId: string, file: File): Promise<CVFile> {
    try {
      // 1. Upload file ke storage
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Dapatkan public URL
      const { data: urlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(fileName);

      // 3. Save record ke database
      const fileData = {
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        storage_path: fileName,
      };

      return await this.saveCVRecord(userId, fileData);
    } catch (error: unknown) {
      console.error("Error uploading CV:", error);
      throw error;
    }
  }
};