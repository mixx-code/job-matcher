/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Header from "../components/Dashboard/Header";
import FileInput from "@/components/Fileupload";
import { Session } from "inspector/promises";
import { useRouter } from "next/router";
import { checkAuthStatus, getCurrentSession, getCurrentUserWithProfile } from "@/lib/getSession";
import { supabase } from "@/lib/supabaseClient";
import { fetchJobsData } from "@/utils/fetchJobs";
import CVAnalysisComponent from "@/components/CVAnalysisComponent";
import MatchedJobsPage from "@/components/matched-jobs";
import Layout from "@/components/Layout";


export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [jobsIndo, setJobsIndo] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<any>(null);
  const [cvData, setCvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // TAMBAHAN: Key untuk force refresh
  const router = useRouter();

  // Effect 1: Cek auth dan ambil session/user
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        if (!authStatus.isAuthenticated) {
          router.push("/login");
          return;
        }

        const [sessionData, userData] = await Promise.all([
          getCurrentSession(),
          getCurrentUserWithProfile()
        ]);

        setUser(userData);
        setUserId(userData?.id);

        console.log("userData :", userData?.id);

        const { data, error } = await supabase
          .from('user_cvs')
          .select('*')
          .eq('user_id', String(userData?.id))
          .order('created_at', { ascending: false })
          .limit(1)
        console.log("user_cvs:", data);

        if (error) {
          console.error('Error fetching CV data:', error);
        }

        if (data && data.length > 0) {
          console.log("CV data:", data[0]);
          setCvData(data[0]);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  const fetchAllJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const result = await response.json()
      console.log("📋 Jobs data dashboard:", result.data)

      if (result.success) {
        console.log("ini result", result.data)
        console.log(`Total jobs: ${result.count}`)
        setJobsIndo(result.data)
        return result.data
      }
      return []
    } catch (error) {
      console.error('Error:', error)
      return []
    }
  };

  useEffect(() => {
    fetchAllJobs();
  }, []);

  useEffect(() => {
    console.log("📌 User data updated:", user);
    console.log("📌 Session data:", session);
    console.log("📌 CV data:", cvData);
  }, [user, session, cvData]);

  // PERBAIKAN 1: Handler untuk update CV data setelah upload berhasil
  const handleCvUploadSuccess = (newCvData: any) => {
    console.log("✅ CV Upload Success - Updating state:", newCvData);
    setCvData(newCvData);
    setRefreshKey(prev => prev + 1); // Force refresh CVAnalysisComponent
  };

  return (
    <div className="w-[100%] min-h-screen bg-gray-50 box-border">
      <Layout>
        <div className="mt-8">
          <FileInput 
            userId={user?.id} 
            file_name={cvData?.file_name} 
            onSuccess={handleCvUploadSuccess}  // PERBAIKAN: Gunakan handler baru
          />
          {
            cvData === null ? (
              <div className="text-center">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-medium">
                  ⏳ Upload CV untuk memulai analisis
                </span>
              </div>
            ) : (
              <>
                <CVAnalysisComponent key={refreshKey} />  {/* PERBAIKAN: Tambahkan key untuk force refresh */}
                <MatchedJobsPage dataJobApi={jobs} user_id={user?.id} dataJobsIndo={jobsIndo} />
              </>
            )
          }
        </div>
      </Layout>
    </div>
  );
}