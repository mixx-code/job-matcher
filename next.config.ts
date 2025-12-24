import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  
  // serverComponentsExternalPackages sudah dipindahkan ke root config di Next.js 15
  serverExternalPackages: ['@google/generative-ai', 'pdf-parse', 'mammoth', 'pdf2json', 'pdfjs-dist'],
  
  // Opsi untuk menghindari error build
  // eslint dan typescript config harus di luar root object atau menggunakan cara lain
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  
  // Tambahkan ini sebagai experimental options jika diperlukan
  experimental: {
    // Tambahkan experimental options di sini jika ada
  },
};

export default nextConfig;