// pages/index.js
import Link from 'next/link'

export default function Home() {
  const features = [
    {
      title: "Analisis CV AI",
      description: "AI menganalisis CV Anda dan memberikan rekomendasi perbaikan instan",
      icon: (
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Pencocokan Cerdas",
      description: "Temukan pekerjaan yang cocok dengan keahlian dan preferensi Anda",
      icon: (
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    }
  ]

  const steps = [
    {
      number: "01",
      title: "Unggah CV",
      description: "Upload CV Anda dalam format PDF atau DOCX"
    },
    {
      number: "02",
      title: "Analisis AI",
      description: "Dapatkan analisis mendalam dari AI kami"
    },
    {
      number: "03",
      title: "Temukan Kerja",
      description: "Dapatkan rekomendasi pekerjaan terbaik"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Navbar */}

      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                CV<span className="text-blue-600">AI</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Fitur</a>
              <a href="#how" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Cara Kerja</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Tentang</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Sign In / Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="text-blue-600">Analisis CV AI</span> untuk Karir yang Lebih Baik
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Platform AI pertama di Indonesia yang menganalisis CV Anda secara cerdas, memberikan rekomendasi perbaikan, dan mencocokkan dengan peluang kerja terbaik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg"
              >
                Mulai Gratis
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a 
                href="#features"
                className="btn-secondary inline-flex items-center justify-center text-lg"
              >
                Lihat Demo
              </a>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-20">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
              <div className="flex flex-wrap justify-center gap-5">
                {features.map((feature, index) => (
                  <div key={index} className="text-center p-6 bg-blue-50 rounded-xl">
                    <div className="flex justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{feature.title}</h3>
                    <p className="text-gray-600 mt-2">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mengapa Memilih CVAI?
            </h2>
            <p className="text-gray-600 text-lg">
              Teknologi AI terdepan untuk membantu Anda mencapai karir impian
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center hover:border-blue-200 border-2 border-transparent transition-all duration-300 hover:-translate-y-2">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-blue-100 rounded-xl">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2">
                  Pelajari lebih lanjut
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mulai dalam 3 Langkah Mudah
            </h2>
            <p className="text-gray-600 text-lg">
              Proses sederhana untuk hasil yang maksimal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 right-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-transparent transform translate-x-1/2"></div>
                )}
                <div className="card text-center space-y-6 bg-white/80 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-blue-600 bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10.000+</div>
              <div className="text-blue-200">Pengguna Aktif</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-200">Tingkat Kepuasan</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50.000+</div>
              <div className="text-blue-200">CV Dianalisis</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5.000+</div>
              <div className="text-blue-200">Pekerjaan Ditemukan</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-12 border border-blue-100">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Siap Mengoptimalkan Karir Anda?
            </h2>
            <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
              Bergabung dengan ribuan profesional yang telah menemukan jalur karir terbaik melalui teknologi AI kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg"
              >
                Daftar Sekarang Gratis
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="btn-secondary inline-flex items-center justify-center text-lg"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-2xl font-bold">
                  CV<span className="text-blue-400">AI</span>
                </span>
              </div>
              <p className="text-gray-400">
                Platform AI untuk analisis CV dan pencarian kerja terdepan di Indonesia.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Produk</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Analisis CV</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Pencarian Kerja</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Wawancara AI</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Perusahaan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Karir</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Bantuan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} CVAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}