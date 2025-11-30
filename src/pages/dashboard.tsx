"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import CVAnalysis from "../components/CVAnalysis";
import { CVTextExtractor } from "../lib/cv-text-extractor";
import { CVFile } from "../types/supabase";

// Import komponen-komponen baru
import LoadingSpinner from "../components/Dashboard/LoadingSpinner";
import Header from "../components/Dashboard/Header";
import UserProfile from "../components/Dashboard/UserProfile";
import CVSection from "../components/Dashboard/CVSection";
import QuickStats from "../components/Dashboard/QuickStats";
import RecentActivity from "../components/Dashboard/RecentActivity";

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cvFile, setCvFile] = useState<CVFile | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [cvText, setCvText] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser({ ...session.user, ...profile });
        await loadUserCV(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) router.push("/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadUserCV = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_cvs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setCvFile(data);
        setCvText(
          `${user?.email?.split("@")[0] || "User"}\n${
            data.file_name
          }\n\nCV content for AI analysis...`
        );
      }
    } catch (error) {
      console.log("No CV found");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload PDF or Word document");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      // Generate unique file name dengan user ID folder
      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}/${Date.now()}-${file.name}`;

      console.log("Uploading file:", fileName);

      // Upload file langsung
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);

        // Specific error handling
        if (
          uploadError.message?.includes("bucket") ||
          uploadError.message?.includes("not found")
        ) {
          alert(
            "Storage bucket 'cvs' not found. Please check Supabase Storage configuration."
          );
        } else if (
          uploadError.message?.includes("policy") ||
          uploadError.message?.includes("permission")
        ) {
          alert(
            `Storage permissions issue:\n\nPlease check bucket policies in Supabase:\n1. Go to Storage > cvs bucket > Policies\n2. Ensure policies exist for:\n   - INSERT (upload)\n   - SELECT (read)\n   - UPDATE (update)\n3. Set all policies to public or authenticated users`
          );
        } else if (uploadError.message?.includes("exists")) {
          // Try with different filename
          const newFileName = `${session.user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
          const { error: retryError } = await supabase.storage
            .from("cvs")
            .upload(newFileName, file);

          if (retryError) {
            throw retryError;
          }

          // Continue with new file name
          await saveCVRecord(newFileName, file);
          return;
        } else {
          throw uploadError;
        }
        return;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("cvs")
        .getPublicUrl(fileName);

      console.log("Public URL:", urlData);

      // Save to database
      await saveCVRecord(fileName, file);
    } catch (error: any) {
      console.error("Upload process error:", error);
      alert(
        `Upload failed: ${error.message || "Please check console for details"}`
      );
    }
  };

  // Helper function untuk save ke database
  const saveCVRecord = async (fileName: string, file: File) => {
    const { data: urlData } = supabase.storage
      .from("cvs")
      .getPublicUrl(fileName);

    const { data: cvData, error: dbError } = await supabase
      .from("user_cvs")
      .upsert({
        user_id: session!.user.id,
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
      console.error("Database error:", dbError);
      throw new Error(`Failed to save CV record: ${dbError.message}`);
    }

    setCvFile(cvData);
    setCvText(
      `CV File: ${
        file.name
      }\nUploaded: ${new Date().toLocaleDateString()}\nSize: ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)} MB\n\nReady for AI analysis.`
    );
    alert("CV uploaded successfully! Ready for AI analysis.");
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleStartJobSearch = () => {
    // Implement job search functionality
    alert("Starting new job search...");
  };

  if (loading) return <LoadingSpinner />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <UserProfile user={user} />
        <div className="border-t border-gray-200 my-6"></div>
        <CVSection
          cvFile={cvFile}
          user={user}
          session={session} // Tambahkan session prop
          onFileUpload={handleFileUpload}
          onShowAnalysis={() => {}} // Kosongkan karena tidak dipakai lagi
        />
        <QuickStats />
        <RecentActivity onStartJobSearch={handleStartJobSearch} />
        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </main>

      {showAnalysis && (
        <CVAnalysis cvText={cvText} onClose={() => setShowAnalysis(false)} />
      )}
    </div>
  );
}
