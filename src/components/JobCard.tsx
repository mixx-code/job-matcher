/* eslint-disable react-hooks/static-components */
import React, { useState, useEffect } from 'react';
import {
    Card,
    Tag,
    Progress,
    List,
    Button,
    Space,
    Typography,
    Row,
    Col,
    Divider,
    Grid,
    message,
    Modal
} from 'antd';
import {
    UserOutlined,
    EnvironmentOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
    LinkOutlined,
    SaveOutlined,
    BulbOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { saveJobToDatabase, checkIfJobSaved } from '@/lib/saveJob';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { confirm } = Modal;

interface Job {
    job_url: string;
    job_title: string;
    company: string;
    location: string;
    job_description: string;
    is_remote: boolean;
    salary_range: string;
    match_score: number;
    match_reasons: string[];
    missing_skills: string[];
    recommended_actions: string[];
}

interface JobCardProps {
    job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
    const screens = useBreakpoint();
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [userId, setUserId] = useState<string>('');

    console.log("ini job: ", job);

    const getScoreColor = (score: number) => {
        if (score >= 70) return '#52c41a';
        if (score >= 50) return '#faad14';
        return '#ff4d4f';
    };

    // Get user ID (contoh sederhana, ganti dengan auth system yang sebenarnya)
    useEffect(() => {
        // Ambil user ID dari localStorage atau auth context
        const storedUserId = localStorage.getItem('user_id') || 'guest-123';
        setUserId(storedUserId);
    }, []);

    // Cek apakah job sudah disimpan
    useEffect(() => {
        const checkSavedStatus = async () => {
            if (userId && job.job_url) {
                const saved = await checkIfJobSaved(job.job_url, userId);
                setIsSaved(saved);
            }
        };

        checkSavedStatus();
    }, [job.job_url, userId]);

    const handleSaveJob = async () => {
        if (isSaved) {
            message.info('Job sudah disimpan sebelumnya');
            return;
        }

        if (!userId) {
            message.error('Silakan login untuk menyimpan job');
            return;
        }

        setIsSaving(true);

        try {
            // Tampilkan konfirmasi sebelum menyimpan
            confirm({
                title: 'Simpan Lowongan Kerja',
                icon: <ExclamationCircleOutlined />,
                content: `Apakah Anda yakin ingin menyimpan lowongan "${job.job_title}"?`,
                okText: 'Ya, Simpan',
                cancelText: 'Batal',
                onOk: async () => {
                    const jobData = {
                        job_url: job.job_url || '',
                        job_title: job.job_title || '',
                        company: job.company || '',
                        location: job.location || '',
                        salary_range: job.salary_range || 'Informasi tidak tersedia',
                        user_id: userId,
                        status: 'saved' as const
                    };

                    const result = await saveJobToDatabase(jobData);

                    if (result.success) {
                        message.success('Lowongan berhasil disimpan!');
                        setIsSaved(true);

                        // Simpan ke localStorage juga untuk cache
                        const savedJobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
                        savedJobs.push(job.job_url);
                        localStorage.setItem('saved_jobs', JSON.stringify(savedJobs));
                    } else {
                        message.error(`Gagal menyimpan: ${result.message || 'Unknown error'}`);
                    }
                },
                onCancel() {
                    message.info('Batal menyimpan');
                },
            });

        } catch (error) {
            console.error('Error saving job:', error);
            message.error('Terjadi kesalahan saat menyimpan');
        } finally {
            setIsSaving(false);
        }
    };

    const ProgressCircle = ({ score }: { score: number }) => {
        const color = getScoreColor(score);

        return (
            <div style={{ textAlign: 'center' }}>
                <Progress
                    type="circle"
                    percent={score}
                    strokeColor={color}
                    size={screens.xs ? 70 : 80}
                    format={(percent) => (
                        <div style={{ fontSize: screens.xs ? '16px' : '18px', fontWeight: 'bold', color }}>
                            {percent}%
                        </div>
                    )}
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    Match
                </div>
            </div>
        );
    };

    return (
        <Card
            style={{
                marginBottom: 16,
                borderLeft: '4px solid #1890ff',
                borderRadius: 8
            }}
            bodyStyle={{ padding: screens.xs ? 16 : 24 }}
            hoverable
        >
            {/* Header Section */}
            <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={18}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space wrap>
                            <Title
                                level={screens.xs ? 5 : 4}
                                style={{ margin: 0 }}
                            >
                                <a
                                    href={job.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit' }}
                                >
                                    {job.job_title}
                                </a>
                            </Title>
                            {job.is_remote && (
                                <Tag color="green" icon={<CheckCircleOutlined />}>
                                    Remote
                                </Tag>
                            )}
                            {isSaved && (
                                <Tag color="blue" icon={<SaveOutlined />}>
                                    Tersimpan
                                </Tag>
                            )}
                        </Space>

                        <Row gutter={[8, 8]} align="middle">
                            <Col flex="none">
                                <Space size="small">
                                    <UserOutlined style={{ color: '#666' }} />
                                    <Text strong>{job.company}</Text>
                                </Space>
                            </Col>
                            <Col flex="none">
                                <Text type="secondary">•</Text>
                            </Col>
                            <Col flex="auto">
                                <Space size="small">
                                    <EnvironmentOutlined style={{ color: '#666' }} />
                                    <Text>{job.location}</Text>
                                </Space>
                            </Col>
                        </Row>
                    </Space>
                </Col>

                <Col xs={24} sm={6} style={{ textAlign: screens.xs ? 'center' : 'right' }}>
                    <ProgressCircle score={Number(job.match_score)} />
                </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            {/* Description */}
            <Paragraph
                ellipsis={{
                    rows: 3,
                    expandable: true,
                    symbol: 'Read more'
                }}
                style={{ marginBottom: 20 }}
            >
                {job.job_description}
            </Paragraph>

            {/* Match Reasons */}
            {job.match_reasons?.length > 0 && (
                <Card
                    size="small"
                    style={{ marginBottom: 20, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
                    bodyStyle={{ padding: screens.xs ? 12 : 16 }}
                >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <Text strong>Why You're a Good Match</Text>
                        </Space>

                        <List
                            size="small"
                            dataSource={job.match_reasons}
                            renderItem={(reason) => (
                                <List.Item style={{ padding: '4px 0' }}>
                                    <Space align="start">
                                        <div style={{
                                            width: 6,
                                            height: 6,
                                            backgroundColor: '#52c41a',
                                            borderRadius: '50%',
                                            marginTop: 6
                                        }} />
                                        <Text>{reason}</Text>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </Space>
                </Card>
            )}

            {/* Salary & Actions */}
            <Row
                gutter={[16, 16]}
                align="middle"
                style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}
            >
                <Col xs={24} md={12}>
                    <Space>
                        <DollarCircleOutlined style={{ color: '#666', fontSize: '18px' }} />
                        <Text strong style={{ fontSize: screens.xs ? '14px' : '16px' }}>
                            {job.salary_range}
                        </Text>
                    </Space>
                </Col>

                <Col xs={24} md={12}>
                    <Row gutter={[8, 8]} justify={screens.md ? 'end' : 'start'} style={{ gap: "10px" }}>
                        <Col xs={12} sm={8} md={8}>
                            <Button
                                type="primary"
                                block
                                href={job.job_url}
                                target="_blank"
                                icon={<LinkOutlined />}
                            >
                                {screens.xs ? 'View' : 'View Job'}
                            </Button>
                        </Col>
                        <Col xs={12} sm={8} md={8}>
                            <Button
                                block
                                icon={<SaveOutlined />}
                                onClick={handleSaveJob}
                                loading={isSaving}
                                type={isSaved ? "default" : "primary"}
                                style={{ backgroundColor: isSaved ? '#f0f0f0' : '#59AC77' }}
                                disabled={isSaved || !userId}
                            >
                                {isSaved
                                    ? (screens.xs ? 'Saved' : 'Saved')
                                    : (screens.xs ? 'Save' : 'Save Job')
                                }
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* Recommended Actions */}
            {job.recommended_actions?.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                    <Space style={{ marginBottom: 12 }}>
                        <BulbOutlined style={{ color: '#1890ff' }} />
                        <Text strong>Recommended Actions</Text>
                    </Space>

                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {job.recommended_actions.map((action, index) => (
                            <Card
                                key={index}
                                size="small"
                                style={{
                                    backgroundColor: '#e6f7ff',
                                    borderColor: '#91d5ff'
                                }}
                                bodyStyle={{ padding: '12px' }}
                            >
                                <Space align="start">
                                    <div style={{
                                        width: 6,
                                        height: 6,
                                        backgroundColor: '#1890ff',
                                        borderRadius: '50%',
                                        marginTop: 6
                                    }} />
                                    <Text>{action}</Text>
                                </Space>
                            </Card>
                        ))}
                    </Space>
                </div>
            )}
        </Card>
    );
};

export default JobCard;