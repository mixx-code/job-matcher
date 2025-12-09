import { supabase } from "@/lib/supabaseClient"
import { NextApiRequest, NextApiResponse } from "next"

// pages/api/jobs/random.ts - ALTERNATIVE RANDOM
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    })
  }

  try {
    // Pertama, ambil total count terlebih dahulu
    const { count: totalCount, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw countError
    }

    // Jika tidak ada data
    if (!totalCount || totalCount === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total_in_database: 0,
        data: []
      })
    }

    // Batasi jumlah yang diambil maksimal 50 atau total data (ambil yang lebih kecil)
    const limit = Math.min(50, totalCount)
    
    // Method 1: Menggunakan RANDOM() jika didukung
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('random()')
        .limit(limit)

      if (error) {
        throw error // Jika error, lanjut ke method 2
      }

      return res.status(200).json({
        success: true,
        count: data?.length || 0,
        total_in_database: totalCount,
        data: data || []
      })

    } catch (randomError) {
      // Method 2: Jika RANDOM() tidak didukung, ambil semua lalu acak di sisi server
      console.log('RANDOM() not supported, using server-side shuffling')
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')

      if (error) {
        throw error
      }

      // Acak data di sisi server
      const shuffledData = data ? 
        [...data]
          .sort(() => Math.random() - 0.5)
          .slice(0, limit) : []

      return res.status(200).json({
        success: true,
        count: shuffledData.length,
        total_in_database: totalCount,
        data: shuffledData
      })
    }

  } catch (error) {
    console.error('Error fetching random jobs:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: 'Failed to fetch random jobs data'
    })
  }
}