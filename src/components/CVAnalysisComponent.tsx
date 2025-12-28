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
    ArrowUpOutlined,
    FileSearchOutlined,
    RocketOutlined,
    DeleteOutlined,
    SaveOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentSession, getCurrentUserWithProfile } from '@/lib/getSession';
import type { Database } from '@/types/supabase';

export interface MatchedJob {
    job_title: string;
    company: string;
    location: string;
    match_score: number;
    match_reasons: string[];
    salary_range: string;
    job_url: string;
}

// Komponen untuk preview dan edit ekstrak text
const TextPreviewEditor = ({
    text,
    onSave,
    onClose
}: {
    text: string;
    onSave: (newText: string) => Promise<void>;
    onClose: () => void;
}) => {
    const [editingText, setEditingText] = useState(text);
    const [isSaving, setIsSaving] = useState(false);

    function formatCVText(inputText: string): string {
        if (!inputText) return '';

        let formatted = inputText;

        // 1. Personal Information - tambahkan line breaks
        formatted = formatted.replace(/([A-Z][a-z]+ [A-Z][a-z]+(?: [A-Z][a-z]+)?),/g, '$1,\n');
        formatted = formatted.replace(/(Phone\/Whatsapp): /g, '\n$1: ');
        formatted = formatted.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '\n$1');
        formatted = formatted.replace(/(LinkedIn \| Drive \| Project \| GitHub \| Medium)/g, '\n$1\n');

        // 2. PROFESSIONAL SUMMARY - tambahkan line break sebelum dan setelah
        formatted = formatted.replace(/(PROFESSIONAL SUMMARY)/g, '\n\n$1\n');

        // 3. WORK EXPERIENCE - tambahkan line break sebelum
        formatted = formatted.replace(/(WORK EXPERIENCE)/g, '\n\n$1\n');

        // 4. Setiap perusahaan - tambahkan line break
        formatted = formatted.replace(/(Turnkey Resources|PT Arcon Penta Persada)/g, '\n$1');

        // 5. Tanggal pekerjaan - tambahkan line break
        formatted = formatted.replace(/(Jan \d{4} – (?:April|Dec) \d{4} \(.*?\))/g, '$1\n');

        // 6. Key Projects & Impact - tambahkan line break
        formatted = formatted.replace(/(Key Projects & Impact:)/g, '\n$1\n');

        // 7. EDUCATION - tambahkan line break
        formatted = formatted.replace(/(EDUCATION)/g, '\n\n$1\n');

        // 8. CERTIFICATION - tambahkan line break
        formatted = formatted.replace(/(CERTIFICATION)/g, '\n\n$1\n');

        // 9. SKILLS - tambahkan line break
        formatted = formatted.replace(/(SKILLS)/g, '\n\n$1\n');

        // 10. LANGUAGES - tambahkan line break
        formatted = formatted.replace(/(LANGUAGES)/g, '\n\n$1\n');

        // 11. LEARNING LAB/MODULE - tambahkan line break
        formatted = formatted.replace(/(LEARNING LAB\/MODULE)/g, '\n\n$1\n');

        // 12. ORGANIZATION - tambahkan line break
        formatted = formatted.replace(/(ORGANIZATION)/g, '\n\n$1\n');

        // 13. Format bullet points konsisten
        formatted = formatted.replace(/●/g, '\n● ');
        formatted = formatted.replace(/○/g, '\n  ○ ');
        formatted = formatted.replace(/•/g, '\n• ');
        formatted = formatted.replace(/o /g, '\n  o ');
        formatted = formatted.replace(/■ /g, '\n    ■ ');

        // 14. Format sub-sub bullet points
        formatted = formatted.replace(/    ○ ([A-Z])/g, '    • $1');

        // 15. Hapus nomor halaman
        formatted = formatted.replace(/-- \d+ of \d+ --/g, '\n');

        // 16. Bersihkan multiple spaces
        formatted = formatted.replace(/ +/g, ' ');

        // 17. Tambahkan line breaks untuk kalimat panjang di professional summary
        formatted = formatted.replace(/(\. )([A-Z])/g, '$1\n$2');

        // 18. Format setiap skill category
        formatted = formatted.replace(/(● [A-Za-z &]+:)/g, '\n$1');

        // 19. Format campus life
        formatted = formatted.replace(/(Campus Life:)/g, '\n$1\n');

        // 20. Format organization entries
        formatted = formatted.replace(/o ([A-Za-z].*?Chairman)/g, '\no $1');
        formatted = formatted.replace(/• ([A-Za-z].*?Chairman)/g, '\n• $1');

        // 21. Tambahkan spacing untuk readability
        formatted = formatted.replace(/\n\n+/g, '\n\n');

        // 22. Trim whitespace
        formatted = formatted.split('\n').map(line => line.trim()).join('\n');

        return formatted.trim();
    }

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await onSave(editingText);
            message.success('Text berhasil disimpan!');
            onClose();
        } catch (error) {
            console.error('Error saving text:', error);
            message.error('Gagal menyimpan text');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <EditOutlined className="text-blue-500" />
                    <span>Preview & Edit Extracted Text</span>
                </div>
            }
            open={true}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Batal
                </Button>,
                <Button
                    key="save"
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={isSaving}
                    onClick={handleSave}
                >
                    Simpan Perubahan
                </Button>
            ]}
        >
            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-blue-600">
                                {editingText.length.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-500">Karakter</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {editingText.split(/\s+/).length.toLocaleString()}
                            </div>
                            <div className="text-sm text-green-500">Kata</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-600">
                                {editingText.split('\n').length}
                            </div>
                            <div className="text-sm text-purple-500">Baris</div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-medium text-gray-700">
                            Edit Text:
                        </label>
                        <div className="text-sm text-gray-500">
                            {Math.round((editingText.length / 20000) * 100)}% dari batas maksimal
                        </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                        <textarea
                            value={formatCVText(editingText)}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full h-[500px] p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none"
                            placeholder="Edit CV text disini..."
                            maxLength={20000}
                            style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                lineHeight: '1.8',
                            }}
                            spellCheck="false"
                        />
                    </div>
                    <div className="text-right text-sm text-gray-500 mt-1">
                        {editingText.length}/20000 karakter
                    </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <BulbOutlined />
                        Tips untuk hasil analisis yang lebih baik:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                        <li>Pastikan informasi personal (nama, email, telepon) lengkap</li>
                        <li>Sertakan pengalaman kerja dengan detail</li>
                        <li>Tambahkan skill dan kompetensi yang relevan</li>
                        <li>Gunakan format yang rapi dan terstruktur</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

// Tipe dari Database
type Tables = Database['public']['Tables'];
type UserCvRow = Tables['user_cvs']['Row'];
type CvAnalysesRow = Tables['cv_analyses']['Row'];
type CvAnalysesInsert = Tables['cv_analyses']['Insert'];
type CvAnalysesUpdate = Tables['cv_analyses']['Update'];

export interface CVAnalysisData {
    personalInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
    };
    overallScore?: number;
    summary?: string;
    professionalSummary?: {
        field?: string;
        experienceLevel?: string;
        keyExpertise?: string[];
    };
    skillMatch?: Record<string, number>;
    rekomendasiJobs?: string[];
    strengths?: string[];
    improvements?: string[];
    missingSkills?: string[];
    recommendations?: string[];
}

const CVAnalysisComponent = () => {
    const [loading, setLoading] = useState(false);
    const [textCv, setTextCv] = useState<'' | string>('');
    const [dataCvAnalysis, setDataCvAnalysis] = useState<CVAnalysisData | null>(null);
    const [user_id, setUser_id] = useState('');
    const [showTextEditor, setShowTextEditor] = useState(false);
    const [userCvId, setUserCvId] = useState<string | null>(null);
    const [jobsIndo, setJobsIndo] = useState<Database['public']['Tables']['jobs']['Row'][]>([]);

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

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#52c41a';
        if (score >= 70) return '#faad14';
        return '#ff4d4f';
    };

    const getScoreTextColor = (score: number) => {
        if (score >= 80) return 'text-green-700';
        if (score >= 70) return 'text-yellow-700';
        return 'text-red-700';
    };

    const updateExtractedText = async (newText: string): Promise<void> => {
        try {
            if (!userCvId) {
                throw new Error('ID CV tidak ditemukan');
            }
            const { data, error } = await supabase
                .from('user_cvs')
                .update({
                    extracted_text: newText,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userCvId)
                .select();

            if (error) {
                console.error('Error updating extracted_text:', error);
                throw error;
            }

            console.log('extracted_text berhasil diupdate:', data);
            setTextCv(newText);
        } catch (error) {
            console.error('Error dalam updateExtractedText:', error);
            throw error;
        }
    };

    const saveCvAnalysisToSupabase = async (cvAnalysisData: CVAnalysisData, userId: string) => {
        try {
            if (!cvAnalysisData || typeof cvAnalysisData !== 'object') {
                throw new Error('Data analisis CV tidak valid');
            }

            if (!userId) {
                throw new Error('User ID diperlukan untuk menyimpan data');
            }

            const analysisData: CvAnalysesInsert = {
                user_id: userId,
                analysis_data: cvAnalysisData as Database['public']['Tables']['cv_analyses']['Insert']['analysis_data'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('💾 Menyimpan data ke Supabase:', analysisData);

            const { data, error } = await supabase
                .from('cv_analyses')
                .insert([analysisData])
                .select()
                .single();

            if (error) {
                console.error('Error menyimpan data ke Supabase:', error);
                throw error;
            }

            console.log('✅ Data berhasil disimpan:', data);

            return {
                success: true,
                message: 'Data analisis CV berhasil disimpan',
                data: data as CvAnalysesRow,
                analysisId: data?.id
            };
        } catch (error) {
            console.error('Error dalam saveCvAnalysisToSupabase:', error);
            return {
                success: false,
                message: 'Gagal menyimpan data analisis CV',
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
                return {
                    success: false,
                    message: error.message || 'Gagal mengambil data analisis CV',
                    error: error,
                    data: []
                };
            }

            console.log('📊 Data analisis CV ditemukan:', data);

            if (data && data.length > 0 && data[0]) {
                const cvAnalysis = data[0] as CvAnalysesRow;
                console.log('✅ Mengatur data analisis CV ke state');

                // Set state dengan data analysis
                setDataCvAnalysis(cvAnalysis.analysis_data as CVAnalysisData);

                return {
                    success: true,
                    data: data as CvAnalysesRow[],
                    hasData: true
                };
            } else {
                console.log('⚠️ Tidak ada data analisis CV ditemukan untuk user:', userId);
                setDataCvAnalysis(null);

                return {
                    success: true,
                    data: [],
                    hasData: false,
                    message: 'Belum ada data analisis CV'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: 'Gagal mengambil data analisis CV',
                data: []
            };
        }
    };

    const deleteAllUserCvAnalyses = async (userId: string) => {
        try {
            if (!userId) {
                throw new Error('User ID diperlukan');
            }

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
                message: 'Gagal menghapus data analisis CV',
                error: error,
                deletedCount: 0
            };
        }
    };

    const fetchAllJobs = async () => {
        try {
            const response = await fetch('/api/jobs')
            const result = await response.json()

            if (result.success) {
                console.log("📋 Jobs data:", result.data)
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

    // useEffect untuk load data saat component mount
    useEffect(() => {
        const getEkstrakText = async () => {
            try {
                const [sessionData, userData] = await Promise.all([
                    getCurrentSession(),
                    getCurrentUserWithProfile()
                ]);

                if (!userData?.id) {
                    console.log('⚠️ User tidak ditemukan');
                    return;
                }

                console.log('👤 User ID:', userData.id);
                setUser_id(userData.id);

                // Ambil CV data
                const { data, error } = await supabase
                    .from('user_cvs')
                    .select('id, extracted_text, created_at, file_name')
                    .eq('user_id', String(userData.id))
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) {
                    console.error('❌ Error mengambil extracted_text:', error);
                    return;
                }

                if (data && data.length > 0) {
                    const cvData = data[0] as UserCvRow;
                    if (cvData && cvData.extracted_text) {
                        console.log("✅ extracted_text ditemukan dari file:", cvData.file_name);
                        setTextCv(cvData.extracted_text);
                        setUserCvId(cvData.id);
                    } else {
                        console.log("⚠️ Tidak ada extracted_text ditemukan");
                        setTextCv('');
                        setUserCvId(null);
                    }
                } else {
                    console.log("⚠️ Tidak ada CV data ditemukan");
                    setTextCv('');
                    setUserCvId(null);
                }

                // Load existing analysis
                console.log('🔍 Mencari data analisis yang sudah ada...');
                await getUserCvAnalyses(String(userData.id));

            } catch (error) {
                console.error('❌ Error dalam getEkstrakText:', error);
            }
        };

        getEkstrakText();
        fetchAllJobs();
    }, []);

    const handleAnalyzeCv = async () => {
        try {
            setLoading(true);
            console.log('🚀 Memulai analisis CV...');

            // 1. Analisis CV
            const response = await fetch('/api/analyze-cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cvText: textCv,
                }),
            });

            if (!response.ok) {
                throw new Error('Gagal menganalisis CV');
            }

            const data = await response.json();
            console.log("📊 Data analisis CV:", data);

            // Set data ke state
            console.log('✅ Setting data analisis ke state...');
            setDataCvAnalysis(data as CVAnalysisData);

            // 2. Simpan ke Supabase
            console.log('💾 Menyimpan ke Supabase...');
            const saveResult = await saveCvAnalysisToSupabase(data as CVAnalysisData, String(user_id));

            if (!saveResult.success) {
                console.error('⚠️ Gagal menyimpan ke Supabase, tapi data sudah di-set ke state');
            }

            // 3. Cari job recommendations
            console.log('🔍 Mencari rekomendasi pekerjaan...');
            const findJobs = await fetch('/api/rekomendasi-jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hasilAnalisis: data,
                    listJobs: jobsIndo
                }),
            });

            if (findJobs.ok) {
                const jobsResult = await findJobs.json();
                console.log('✅ Jobs found:', jobsResult);

                if (jobsResult.matched_jobs) {
                    // PERBAIKAN: Hapus semua data jobs lama dari localStorage
                    const keysToRemove = ['jobs', 'matched_jobs_data', 'job_search_cache'];
                    keysToRemove.forEach(key => {
                        localStorage.removeItem(key);
                        console.log(`🗑️ Menghapus ${key} dari localStorage`);
                    });

                    // Simpan data jobs baru ke localStorage
                    localStorage.setItem('jobs', JSON.stringify(jobsResult.matched_jobs));
                    console.log(`✅ ${jobsResult.matched_jobs.length} jobs baru disimpan ke localStorage`);

                    // PERBAIKAN: Normalisasi job titles
                    const jobTitles = jobsResult.matched_jobs
                        .map((job: MatchedJob) => {
                            // Gunakan job_title jika ada, jika tidak gunakan title
                            return job.job_title || 'Untitled Position';
                        })
                        .filter((title: string) => title !== 'Untitled Position')
                        .slice(0, 10); // Batasi maksimal 10 job titles untuk display

                    // Update state dengan job recommendations
                    setDataCvAnalysis(prev => ({
                        ...prev,
                        rekomendasiJobs: jobTitles
                    }));

                    // Tambahan: Tampilkan informasi jumlah jobs
                    message.success(`✅ Analisis CV berhasil! ${jobsResult.matched_jobs.length} jobs ditemukan.`);
                } else {
                    console.warn('⚠️ Tidak ada matched_jobs dalam response');
                    message.warning('Analisis CV berhasil, tapi tidak ada jobs yang cocok ditemukan.');
                }
            } else {
                console.warn('⚠️ API rekomendasi jobs error:', findJobs.status);
                message.warning('Analisis CV berhasil, tapi pencarian jobs mengalami kendala.');
            }

            message.success('✅ Analisis CV berhasil!');

        } catch (error) {
            console.error('❌ Error analyzing CV:', error);
            message.error('Gagal menganalisis CV. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAnalysisCv = async () => {
        try {
            setLoading(true);
            await deleteAllUserCvAnalyses(String(user_id));
            setDataCvAnalysis(null);
            message.success('Data analisis berhasil dihapus');
        } catch (error) {
            console.error('Error deleting analysis:', error);
            message.error('Gagal menghapus data analisis');
        } finally {
            setLoading(false);
        }
    }

    const getTextPreview = () => {
        if (!textCv) return "Belum ada extracted text";

        const preview = textCv.length > 150
            ? textCv.substring(0, 150) + '...'
            : textCv;

        return preview;
    };

    console.log('🎯 Current state - dataCvAnalysis:', dataCvAnalysis);

    return (
        <div className="w-full p-5 bg-gray-50 min-h-screen flex flex-col items-center mx-auto">
            <div className='flex flex-col lg:items-center lg:justify-between gap-4 lg:gap-6'>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto'>
                    <div className='flex flex-wrap items-center gap-3 sm:gap-4'>
                        <Button
                            type="primary"
                            icon={<Bot />}
                            loading={loading && { icon: <SyncOutlined spin /> }}
                            disabled={loading}
                            style={loading ? { backgroundColor: "#1778ff", borderColor: "#1778ff", color: "#fff" } : undefined}
                            onClick={handleAnalyzeCv}
                            className='flex-1 sm:flex-none'
                        >
                            {loading ? "Analyzing..." : dataCvAnalysis === null ? "Analyze Your CV" : "Reanalyze Your CV"}
                        </Button>

                        {textCv && (
                            <Button
                                type="default"
                                icon={<EditOutlined />}
                                onClick={() => setShowTextEditor(true)}
                                size="large"
                                className='flex-1 sm:flex-none'
                            >
                                <span className='hidden sm:inline'>Preview/Edit Extracted Text</span>
                                <span className='sm:hidden'>Edit Text</span>
                            </Button>
                        )}

                        {dataCvAnalysis && (
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
                                className='flex-1 sm:flex-none'
                            >
                                <span className='hidden sm:inline'>Delete Your Analyze</span>
                                <span className='sm:hidden'>Delete</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="w-full lg:flex-1 lg:max-w-lg xl:max-w-xl">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2 flex-wrap">
                                    <FileTextOutlined />
                                    <span>Extracted Text Preview:</span>
                                    <span className='text-[0.7rem] italic text-yellow-500'>Tidak Merubah CV Asli</span>
                                </h4>
                            </div>
                            <span className={`text-sm px-2 py-1 rounded self-start sm:self-auto ${textCv ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {textCv ? 'Tersedia' : 'Tidak tersedia'}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-3">
                            {getTextPreview()}
                        </p>
                        {textCv && (
                            <div className="text-xs text-gray-500 mt-2">
                                {textCv.length.toLocaleString()} karakter • {textCv.split(/\s+/).length.toLocaleString()} kata
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showTextEditor && (
                <TextPreviewEditor
                    text={textCv || ''}
                    onSave={updateExtractedText}
                    onClose={() => setShowTextEditor(false)}
                />
            )}

            {dataCvAnalysis === null ? (
                <div className="w-full p-5 bg-gray-50 min-h-screen flex items-center justify-center">
                    <div className="max-w-md w-full text-center">
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

                            <div className="absolute top-4 left-10 w-8 h-8 bg-yellow-100 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="absolute top-12 right-8 w-6 h-6 bg-green-100 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            <div className="absolute bottom-10 left-8 w-7 h-7 bg-pink-100 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            CV Analysis Awaits!
                        </h2>

                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                            Upload your CV and click the <span className="font-semibold text-blue-600">Analyze Your CV</span> button above to get personalized insights, score, and recommendations.
                        </p>

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
                                    <span>Click Analyze Your CV button</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                                    <span>Get detailed insights and improvement suggestions</span>
                                </li>
                            </ol>
                        </div>

                        <div className="mt-8 animate-bounce">
                            <ArrowUpOutlined className="text-2xl text-blue-500" />
                            <p className="text-sm text-gray-500 mt-2">Click the button above to begin!</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                        {/* Header Section */}
                        <div className="w-full mb-6 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 text-white p-6 shadow-lg mt-7">
                            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                                        <UserOutlined className="text-3xl text-white" />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    {dataCvAnalysis.personalInfo && dataCvAnalysis.personalInfo.name ? (
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                                            {dataCvAnalysis.personalInfo.name}
                                        </h2>
                                    ) : (
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                                                Nama tidak ditemukan
                                            </h2>
                                    )}
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
                                                const getRandomColorClass = (skillName: string) => {
                                                    const hash = Array.from(skillName).reduce((acc: number, char: string) =>
                                                        acc + char.charCodeAt(0), 0
                                                    );
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
                                        {dataCvAnalysis.rekomendasiJobs?.map((job) => (
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
            )}
        </div>
    );
};

export default CVAnalysisComponent;