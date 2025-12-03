/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Header from "../components/Dashboard/Header";
import FileInput from "@/components/Fileupload";
import { Session } from "inspector/promises";
import { useRouter } from "next/router";
import { checkAuthStatus, getCurrentSession, getCurrentUserWithProfile } from "@/lib/getSession";
// import { checkDataCv } from "@/lib/checkDataCv";
import { supabase } from "@/lib/supabaseClient";
import { fetchJobsData } from "@/utils/fetchJobs";
import CVAnalysisComponent from "@/components/CVAnalysisComponent";
import MatchedJobsPage from "@/components/matched-jobs";
import AllJobsList from "@/components/AllJobsList";


export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<any>(null);
  const [cvData, setCvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const JOBS_PER_PAGE = 50;
  const APP_ID = '00b554b3';
  const APP_KEY = '21197ccac6e6dfe8ec6402bbf0ea48b0';

  // Effect 1: Cek auth dan ambil session/user
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Cek auth status dulu
        const authStatus = await checkAuthStatus();
        if (!authStatus.isAuthenticated) {
          router.push("/login");
          return;
        }

        // Ambil session dan user secara paralel
        const [sessionData, userData] = await Promise.all([
          getCurrentSession(),
          getCurrentUserWithProfile()
        ]);

        setSession(sessionData);
        setUser(userData);
        setUserId(userData?.id);

        console.log("userData :", userData?.id);

        // PERBAIKAN: Query yang benar untuk mengambil CV berdasarkan user_id
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
  

  const loadJobs = async (page = 1) => {
    try {
      setLoading(true);

      const url = `https://api.adzuna.com/v1/api/jobs/gb/search/${page}?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=${JOBS_PER_PAGE}&where=london`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("data jobs: ", data.results);

      // Hitung total halaman
      // const calculatedTotalPages = Math.ceil(data.count / JOBS_PER_PAGE);

      setJobs(data.results || []);
      setTotalJobs(data.count);

      console.log(`✅ Loaded ${data.results.length} jobs from API`);

    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(1);
  }, []);


  useEffect(() => {
    console.log("🔍 User data updated:", user);
    console.log("🔍 Session data:", session);
    console.log("🔍 CV data:", cvData);
  }, [user, session, cvData]);


  return (
    <div className="w-[100%] min-h-screen bg-gray-50 box-border">
      <Header user={user} />
      <div className="mt-8  ">
        <FileInput userId={user?.id} file_name={cvData?.file_name} onSuccess={(newCvData) => setCvData(newCvData)} />
        {
          cvData === null ? (
            <div className="text-center">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-medium">
                ⏳ Upload CV untuk memulai analisis
              </span>
            </div>
          ) : (
            <>
              <CVAnalysisComponent />
              <MatchedJobsPage dataJobApi={jobs} user_id={user?.id} />
            </>
          )
        }
        <AllJobsList />
      </div>

    </div>
  );
}