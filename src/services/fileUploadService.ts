import { supabase } from "../lib/supabaseClient";

export const fileUploadService = {
  async uploadCV(file: File, userId: string) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message?.includes("exists")) {
        // Retry dengan nama file berbeda
        const newFileName = `${userId}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        
        const { error: retryError } = await supabase.storage
          .from("cvs")
          .upload(newFileName, file);

        if (retryError) throw retryError;
        return { uploadData: { path: newFileName }, fileName: newFileName };
      }
      throw uploadError;
    }

    return { uploadData, fileName };
  },

  async saveCVRecord(fileName: string, file: File, userId: string) {
    const { data: urlData } = supabase.storage
      .from("cvs")
      .getPublicUrl(fileName);

    const { data: cvData, error: dbError } = await supabase
      .from("user_cvs")
      .upsert({
        user_id: userId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        storage_path: fileName,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Gagal menyimpan data CV: ${dbError.message}`);
    }

    return cvData;
  }
};