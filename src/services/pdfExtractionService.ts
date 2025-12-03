export const pdfExtractionService = {
  async extractTextFromPDF(fileUrl: string, fileName: string) {
    try {
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: fileUrl,
          saveToFile: true
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("API endpoint tidak ditemukan.");
        }

        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`Server error. Status: ${response.status}`);
        }
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Ekstraksi gagal');
      }

      return {
        text: result.text,
        metadata: result.metadata,
        statistics: result.statistics
      };

    } catch (error: any) {
      console.error("❌ Error ekstraksi PDF:", error);
      
      // Return fallback text
      return {
        text: `CV File: ${fileName}\n\nTeks tidak dapat diekstraksi: ${error.message}\n\nSilakan coba upload kembali.`,
        metadata: {},
        statistics: {}
      };
    }
  }
};