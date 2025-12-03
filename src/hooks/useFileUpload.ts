import { useState } from "react";
import { fileUploadService } from "../services/fileUploadService";
import { pdfExtractionService } from "../services/pdfExtractionService";

export const useFileUpload = () => {
  const [extractionStatus, setExtractionStatus] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): { isValid: boolean; message?: string } => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        message: "Silakan upload file PDF atau Word document" 
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { 
        isValid: false, 
        message: "Ukuran file harus kurang dari 5MB" 
      };
    }

    return { isValid: true };
  };

  const uploadFile = async (
    file: File, 
    userId: string, 
    onSuccess?: (cvData: any) => void,
    onError?: (error: string) => void
  ) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      onError?.(validation.message || "File tidak valid");
      return null;
    }

    try {
      setUploading(true);
      setExtractionStatus("Mengupload file...");

      // Upload file ke storage
      const uploadResult = await fileUploadService.uploadCV(file, userId);
      
      // Simpan ke database
      const cvData = await fileUploadService.saveCVRecord(
        uploadResult.fileName,
        file,
        userId
      );

      // Handle text extraction untuk PDF
      if (file.type === "application/pdf") {
        await handlePDFExtraction(cvData, file);
      }

      onSuccess?.(cvData);
      return cvData;
    } catch (error: any) {
      console.error("Upload process error:", error);
      onError?.(error.message || "Upload gagal");
      return null;
    } finally {
      setUploading(false);
      setExtractionStatus("");
    }
  };

  const handlePDFExtraction = async (cvData: any, file: File) => {
    try {
      setExtractionStatus("Mengekstrak teks dari CV...");
      
      const extractionResult = await pdfExtractionService.extractTextFromPDF(
        cvData.file_url,
        file.name
      );

      if (extractionResult.text && !extractionResult.text.includes("tidak dapat diekstraksi")) {
        setExtractionStatus("Ekstraksi berhasil!");
        return extractionResult;
      }
    } catch (error: any) {
      console.error("Extraction failed:", error);
      setExtractionStatus("Ekstraksi teks gagal");
    }
  };

  return {
    extractionStatus,
    uploading,
    validateFile,
    uploadFile,
    handlePDFExtraction
  };
};