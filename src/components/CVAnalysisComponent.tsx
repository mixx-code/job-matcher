"use client"
import { Bot } from 'lucide-react';
import { Button, message, Modal, Progress } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    TrophyOutlined,
    RiseOutlined,
    BulbOutlined,
    ToolOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    SyncOutlined,
    PoweroffOutlined,
    ArrowUpOutlined,
    FileSearchOutlined,
    RocketOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentSession, getCurrentUserWithProfile } from '@/lib/getSession';

const CVAnalysisComponent = () => {


    const [loading, setLoading] = useState(false);

    const [textCv, setTextCv] = useState<'' | string>('');
    const [dataCvAnalysis, setDataCvAnalysis] = useState(null);
    const [user_id, setUser_id] = useState('');

    // List of color combinations
    const colorOptions = [
        { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
        { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
        { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
        { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
        { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
        { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
        { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
        { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
        { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
        { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
    ];

    const getScoreColor = (score) => {
        if (score >= 80) return '#52c41a';
        if (score >= 70) return '#faad14';
        return '#ff4d4f';
    };

    const getScoreTextColor = (score) => {
        if (score >= 80) return 'text-green-700';
        if (score >= 70) return 'text-yellow-700';
        return 'text-red-700';
    };

    const saveCvAnalysisToSupabase = async (cvAnalysisData: object, userId: string) => {
        try {
            // Validasi input
            if (!cvAnalysisData || typeof cvAnalysisData !== 'object') {
                throw new Error('Data analisis CV tidak valid');
            }

            if (!userId) {
                throw new Error('User ID diperlukan untuk menyimpan data');
            }

            // Siapkan data hanya dengan field yang diminta
            const analysisData = {
                user_id: userId,
                analysis_data: cvAnalysisData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('Menyimpan data ke Supabase:', analysisData);

            // Simpan ke Supabase
            const { data, error } = await supabase
                .from('cv_analyses') // Nama tabel di Supabase
                .insert([analysisData])
                .select()
                .single();

            if (error) {
                console.error('Error menyimpan data ke Supabase:', error);
                throw error;
            }

            console.log('Data berhasil disimpan ke Supabase dengan ID:', data.id);
            return {
                success: true,
                message: 'Data analisis CV berhasil disimpan',
                data: data,
                analysisId: data.id
            };

        } catch (error) {
            console.error('Error dalam saveCvAnalysisToSupabase:', error);
            return {
                success: false,
                message: error.message || 'Gagal menyimpan data analisis CV',
                error: error
            };
        }
    };

const getUserCvAnalyses = async (userId: string) => {
    try {
        if (!userId) {
            throw new Error('User ID diperlukan');
        }

        const { data, error } = await supabase
            .from('cv_analyses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error mengambil data dari Supabase:', error);
            // Jangan throw error, kembalikan success: false
            return {
                success: false,
                message: error.message || 'Gagal mengambil data analisis CV',
                error: error,
                data: []
            };
        }

        console.log('Data analisis CV ditemukan:', data);

        // Cek apakah ada data
        if (data && data.length > 0 && data[0]) {
            console.log('Mengatur data analisis CV ke state');
            setDataCvAnalysis(data[0].analysis_data);
            
            return {
                success: true,
                data: data,
                hasData: true
            };
        } else {
            console.log('Tidak ada data analisis CV ditemukan untuk user:', userId);
            // Set state ke null atau empty object
            setDataCvAnalysis(null);
            
            return {
                success: true,
                data: [],
                hasData: false,
                message: 'Belum ada data analisis CV'
            };
        }

    } catch (error) {
        console.error('Error dalam getUserCvAnalyses:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengambil data analisis CV',
            error: error,
            data: []
        };
    }
};

    const deleteAllUserCvAnalyses = async (userId: string) => {
        try {
            if (!userId) {
                throw new Error('User ID diperlukan');
            }

            // Hapus semua data dengan user_id yang sesuai
            const { error, count } = await supabase
                .from('cv_analyses')
                .delete()
                .eq('user_id', userId)

            if (error) {
                console.error('Error menghapus data dari Supabase:', error);
                throw error;
            }

            console.log(`Berhasil menghapus ${count || 0} data analisis CV untuk user ${userId}`);
            return {
                success: true,
                message: `Berhasil menghapus ${count || 0} data analisis CV`,
                deletedCount: count || 0
            };

        } catch (error) {
            console.error('Error dalam deleteAllUserCvAnalyses:', error);
            return {
                success: false,
                message: error.message || 'Gagal menghapus data analisis CV',
                error: error,
                deletedCount: 0
            };
        }
    };


    useEffect(() => {
        const getEkstrakText = async () => {
            try {
                const [sessionData, userData] = await Promise.all([
                    getCurrentSession(),
                    getCurrentUserWithProfile()
                ]);

                // Cek apakah userData ada
                if (!userData?.id) {
                    console.log('User tidak ditemukan');
                    return;
                }

                setUser_id(userData.id);

                // Ambil extracted_text dari user_cvs
                const { data, error } = await supabase
                    .from('user_cvs')
                    .select('extracted_text, created_at, file_name') // tambahkan field untuk debugging
                    .eq('user_id', String(userData.id))
                    .order('created_at', { ascending: false }) // PERUBAHAN DI SINI: false untuk data terbaru
                    .limit(1);

                if (error) {
                    console.error('Error mengambil extracted_text:', error);
                    return;
                }

                // Debug: tampilkan data yang diambil
                console.log("Data yang diambil:", {
                    file_name: data?.[0]?.file_name,
                    created_at: data?.[0]?.created_at,
                    has_text: !!(data?.[0]?.extracted_text),
                    text_length: data?.[0]?.extracted_text?.length
                });

                // Cek apakah data ada dan extracted_text tidak kosong
                if (data && data.length > 0 && data[0].extracted_text) {
                    console.log("extracted_text ditemukan dari file:", data[0].file_name);
                    setTextCv(data[0].extracted_text);
                } else {
                    console.log("Tidak ada extracted_text ditemukan");
                    setTextCv('');
                }

                // Ambil riwayat analisis
                await getUserCvAnalyses(String(userData.id));

            } catch (error) {
                console.error('Error dalam getEkstrakText:', error);
            }
        };

        getEkstrakText();
    }, []);

    console.log("user_id: ", user_id);

    const handleAnalyzeCv = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/analyze-cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cvText: textCv,
                }),
            });

            const data = await response.json();
            console.log("data analisis cv: ", data);
            saveCvAnalysisToSupabase(data, String(user_id));
            setDataCvAnalysis(data);
        } catch (error) {
            console.error('Error analyzing CV:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteAnalysisCv = async () => {
        try {
            setLoading(true);
            await deleteAllUserCvAnalyses(String(user_id));
            setDataCvAnalysis(null);
        } catch (error) {
            console.error('Error deleting analysis:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full p-5 bg-gray-50 min-h-screen flex flex-col items-center mx-auto">
            <div className='flex items-center gap-4'>
                <Button
                    type="primary"
                    icon={<Bot />}
                    loading={loading && { icon: <SyncOutlined spin /> }}
                    disabled={loading}
                    style={loading && { background: "#1778ff", borderColor: "#1778ff", color: "#fff" }}
                    onClick={handleAnalyzeCv}
                >
                    {loading ? "Analyzing..." : dataCvAnalysis === null ? "Analyze Your CV" : "Reanalyze Your CV"}
                </Button>
                {
                    dataCvAnalysis && (
                        <Button
                            type="default"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Hapus Analisis CV',
                                    content: 'Apakah Anda yakin ingin menghapus data analisis CV? Tindakan ini tidak dapat dibatalkan.',
                                    okText: 'Ya, Hapus',
                                    cancelText: 'Batal',
                                    okType: 'danger',
                                    onOk: async () => {
                                        handleDeleteAnalysisCv();
                                    }
                                });
                            }}
                        >
                            Delete Your Analyze
                        </Button>
                    )
                }

            </div>
            {/* Header Section */}
            {
                dataCvAnalysis === null ? (
                    <div className="w-full p-5 bg-gray-50 min-h-screen flex items-center justify-center">
                        <div className="max-w-md w-full text-center">
                            {/* Animated Illustration */}
                            <div className="relative w-64 h-64 mx-auto mb-8">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-pulse">
                                        <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full flex items-center justify-center">
                                                <FileSearchOutlined className="text-4xl text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating elements */}
                                <div className="absolute top-4 left-10 w-8 h-8 bg-yellow-100 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="absolute top-12 right-8 w-6 h-6 bg-green-100 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                <div className="absolute bottom-10 left-8 w-7 h-7 bg-pink-100 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                            </div>

                            {/* Message */}
                            <h2 className="text-3xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                CV Analysis Awaits!
                            </h2>

                            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                                Upload your CV and click the <span className="font-semibold text-blue-600">"Analyze Your CV"</span> button above to get personalized insights, score, and recommendations.
                            </p>

                            {/* Features Preview */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                                        <TrophyOutlined className="text-blue-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Score Analysis</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                                        <CheckCircleOutlined className="text-green-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Strengths</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                                        <ToolOutlined className="text-purple-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Skill Match</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                                        <BulbOutlined className="text-orange-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Job Recommendations</p>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center justify-center">
                                    <RocketOutlined className="mr-2 text-blue-600" />
                                    Get Started in 3 Steps
                                </h3>
                                <ol className="text-left space-y-3 text-gray-600">
                                    <li className="flex items-start">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                                        <span>Upload or paste your CV content</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                                        <span>Click "Analyze Your CV" button</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                                        <span>Get detailed insights and improvement suggestions</span>
                                    </li>
                                </ol>
                            </div>

                            {/* CTA Arrow */}
                            <div className="mt-8 animate-bounce">
                                <ArrowUpOutlined className="text-2xl text-blue-500" />
                                <p className="text-sm text-gray-500 mt-2">Click the button above to begin!</p>
                            </div>
                        </div>
                    </div>
                ) :
                    (
                        <>
                            <div className="w-full mb-6 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 text-white p-6 shadow-lg mt-7">
                                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                                            <UserOutlined className="text-3xl text-white" />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        {
                                            dataCvAnalysis.personalInfo && dataCvAnalysis.personalInfo.name ? (
                                                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                                                    {dataCvAnalysis.personalInfo.name}
                                                </h2>
                                            ) : (
                                                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                                                    nama tidak ditemukan
                                                </h2>
                                            )
                                        }
                                        <div className="flex flex-wrap gap-4 md:gap-6 text-sm md:text-base">
                                            <div className="flex items-center gap-2">
                                                <EnvironmentOutlined className="text-white" />
                                                <span className="text-white">{dataCvAnalysis.personalInfo?.location || "Lokasi tidak ditemukan"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MailOutlined className="text-white" />
                                                <span className="text-white">{dataCvAnalysis.personalInfo?.email || "Email tidak ditemukan"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <PhoneOutlined className="text-white" />
                                                <span className="text-white">{dataCvAnalysis.personalInfo?.phone || "Telepon tidak ditemukan"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Overall Score */}
                            <div className="w-full mb-6">
                                <div className="bg-white rounded-xl p-6 shadow-md">
                                    <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                                        <TrophyOutlined className="mr-2" />
                                        Overall Score
                                    </h3>
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="relative w-36 h-36">
                                                <Progress
                                                    type="dashboard"
                                                    percent={dataCvAnalysis.overallScore || 0}
                                                    strokeColor={getScoreColor(dataCvAnalysis.overallScore || 0)}
                                                    size={150}
                                                    format={percent => (
                                                        <div className={`text-center ${getScoreTextColor(dataCvAnalysis.overallScore || 0)}`}>
                                                            <div className="text-3xl font-bold">{percent}</div>
                                                            <div className="text-sm">Score</div>
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-600 leading-relaxed">{dataCvAnalysis.summary || "Tidak ada ringkasan"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content - Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Professional Summary */}
                                    <div className="bg-white rounded-xl p-6 shadow-md">
                                        <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                                            <RiseOutlined className="mr-2" />
                                            Professional Summary
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="font-medium text-gray-700">Field: </span>
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200">
                                                    {dataCvAnalysis.professionalSummary?.field || "Tidak ditemukan"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Experience Level: </span>
                                                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm border border-purple-200">
                                                    {dataCvAnalysis.professionalSummary?.experienceLevel || "Tidak ditemukan"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Key Expertise:</span>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {dataCvAnalysis.professionalSummary?.keyExpertise?.map(skill => {
                                                        // Generate random color class based on skill name
                                                        const getRandomColorClass = (skillName) => {
                                                            // Create a simple hash from the skill name to get consistent colors for same skill
                                                            const hash = Array.from(skillName).reduce((acc, char) => acc + char.charCodeAt(0), 0);

                                                            // Use hash to select a color (consistent for same skill name)
                                                            const colorIndex = hash % colorOptions.length;
                                                            return colorOptions[colorIndex];
                                                        };

                                                        const colorClass = getRandomColorClass(skill);

                                                        return (
                                                            <span
                                                                key={skill}
                                                                className={`px-3 py-1 rounded-full text-sm border ${colorClass.bg} ${colorClass.text} ${colorClass.border}`}
                                                            >
                                                                {skill}
                                                            </span>
                                                        );
                                                    }) || <span className="text-gray-500">Tidak ada keahlian</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skill Match */}
                                    <div className="bg-white rounded-xl p-6 shadow-md">
                                        <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                                            <ToolOutlined className="mr-2" />
                                            Skill Match Analysis
                                        </h3>
                                        <div className="space-y-4">
                                            {dataCvAnalysis.skillMatch ? Object.entries(dataCvAnalysis.skillMatch).map(([skill, score]) => (
                                                <div key={skill} className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-700 capitalize">
                                                            {skill.charAt(0).toUpperCase() + skill.slice(1)}
                                                        </span>
                                                        <span className={`font-bold ${getScoreTextColor(score)}`}>
                                                            {score}%
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        percent={score}
                                                        strokeColor={getScoreColor(score)}
                                                        size="small"
                                                        showInfo={false}
                                                    />
                                                </div>
                                            )) : <p className="text-gray-500">Analisis skill match tidak tersedia</p>}
                                        </div>
                                    </div>

                                    {/* Recommended Jobs */}
                                    <div className="bg-white rounded-xl p-6 shadow-md">
                                        <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                                            <BulbOutlined className="mr-2" />
                                            Recommended Jobs
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {dataCvAnalysis.rekomendasiJobs?.map((job, index) => (
                                                <div key={job} className="relative group">
                                                    <div className="absolute -top-2 -right-2">
                                                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                                            Hot
                                                        </span>
                                                    </div>
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 min-w-[200px] hover:shadow-lg transition-shadow duration-200">
                                                        <span className="font-semibold text-gray-800">{job}</span>
                                                    </div>
                                                </div>
                                            )) || <p className="text-gray-500">Tidak ada rekomendasi pekerjaan</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Strengths */}
                                    <div className="bg-white rounded-xl p-6 shadow-md">
                                        <h3 className="text-lg font-bold mb-4 flex items-center text-green-600">
                                            <CheckCircleOutlined className="mr-2" />
                                            Strengths ({dataCvAnalysis.strengths?.length || 0})
                                        </h3>
                                        <ul className="space-y-3">
                                            {dataCvAnalysis.strengths?.map((item, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircleOutlined className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700">{item}</span>
                                                </li>
                                            )) || <li className="text-gray-500">Tidak ada strengths yang ditemukan</li>}
                                        </ul>
                                    </div>

                                    {/* Areas for Improvement */}
                                    <div className="bg-white rounded-xl p-6 shadow-md">
                                        <h3 className="text-lg font-bold mb-4 flex items-center text-yellow-600">
                                            <WarningOutlined className="mr-2" />
                                            Areas for Improvement ({dataCvAnalysis.improvements?.length || 0})
                                        </h3>
                                        <ul className="space-y-3">
                                            {dataCvAnalysis.improvements?.map((item, index) => (
                                                <li key={index} className="flex items-start">
                                                    <WarningOutlined className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700">{item}</span>
                                                </li>
                                            )) || <li className="text-gray-500">Tidak ada area perbaikan yang ditemukan</li>}
                                        </ul>
                                    </div>

                                    {/* Missing Skills */}
                                    <div className="bg-white rounded-xl p-6 shadow-md">
                                        <h3 className="text-lg font-bold mb-4 flex items-center text-red-600">
                                            <ToolOutlined className="mr-2" />
                                            Missing Skills ({dataCvAnalysis.missingSkills?.length || 0})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {dataCvAnalysis.missingSkills?.map(skill => (
                                                <span
                                                    key={skill}
                                                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm border border-red-200"
                                                >
                                                    {skill}
                                                </span>
                                            )) || <span className="text-gray-500">Tidak ada skill yang hilang</span>}
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="bg-white rounded-xl p-6 shadow-md">
                                        <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                                            <FileTextOutlined className="mr-2" />
                                            Recommendations
                                        </h3>
                                        <ol className="space-y-3 list-decimal list-inside">
                                            {dataCvAnalysis.recommendations?.map((item, index) => (
                                                <li key={index} className="text-gray-700 pl-2">
                                                    {item}
                                                </li>
                                            )) || <li className="text-gray-500">Tidak ada rekomendasi</li>}
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </>
                    )
            }

        </div>
    );
};

export default CVAnalysisComponent;