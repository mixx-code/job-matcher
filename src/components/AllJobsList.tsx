"use client";
import React, { useEffect, useState } from "react";
import JobCardAll, { JobCardGrid } from "./JobCardAll";
import { Col, Row } from "antd";

const AllJobsList = () => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState([]);
    const JOBS_PER_PAGE = 50;
    const APP_ID = "00b554b3";
    const APP_KEY = "21197ccac6e6dfe8ec6402bbf0ea48b0";

  const formatJobs = (data) => {
    return data.results.map((job) => ({
      // Informasi dasar
      id: job.id,
      title: job.title,
      company: job.company?.display_name || "Unknown Company",

      // Kategori dan jenis pekerjaan
      category: job.category?.label || "Uncategorized",
      category_tag: job.category?.tag || "",
      contract_type: job.contract_type,
      contract_time: job.contract_time,

      // Lokasi
      location: job.location?.display_name || "Location not specified",
      area: job.location?.area || [],
      latitude: job.latitude,
      longitude: job.longitude,

      // Gaji
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_is_predicted: job.salary_is_predicted === "1",
      salary_range:
        job.salary_min === job.salary_max
          ? `£${job.salary_min.toLocaleString()}`
          : `£${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()}`,

      // Deskripsi dan detail
      description: job.description,
      created_date: job.created,
      redirect_url: job.redirect_url,
      adref: job.adref,

      // Metadata tambahan untuk filtering
      is_full_time: job.contract_time === "full_time",
      is_permanent: job.contract_type === "permanent",
      has_salary: !!(job.salary_min || job.salary_max),

      // Format tanggal
      created_formatted: new Date(job.created).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),

      // Jarak waktu posting
      days_ago: Math.floor(
        (new Date() - new Date(job.created)) / (1000 * 60 * 60 * 24)
      ),
    }));
  };

  // Gunakan dalam loadJobs:
  const loadJobs = async (page = 1) => {
    try {
      setLoading(true);
      const url = `https://api.adzuna.com/v1/api/jobs/gb/search/${page}?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=${JOBS_PER_PAGE}&where=london`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Format data
      const formattedJobs = formatJobs(data);

      // Update state
      setJobs(formattedJobs);
      setTotalJobs(data.count);

      console.log(`✅ Loaded ${formattedJobs.length} formatted jobs from API`);
      console.log("Formatted jobs sample:", formattedJobs);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setJobs([]); // Reset jobs jika error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No Jobs Found
        </h3>
        <p className="mt-2 text-gray-500">
          Try adjusting your search criteria or check back later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Matched Jobs ({jobs.length})
        </h2>
      </div>

      <div style={{ padding: "16px" }}>
        <JobCardGrid>
          {jobs.map((job) => (
            <JobCardAll key={job.id} job={job} />
          ))}
        </JobCardGrid>
      </div>
    </div>
  );
};

export default AllJobsList;
