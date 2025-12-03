import React from "react";
import {
  Card,
  Tag,
  Progress,
  Button,
  Typography,
  Divider,
  Grid,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  LinkOutlined,
  SaveOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface JobCardAllProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    salary_range: string;
    salary_min?: number;
    salary_max?: number;
    is_permanent?: boolean;
    is_full_time?: boolean;
    contract_type?: string;
    contract_time?: string;
    category?: string;
    created_formatted?: string;
    days_ago?: number;
    redirect_url: string;
    area?: string[];
    latitude?: number;
    longitude?: number;
    has_salary?: boolean;
    salary_is_predicted?: boolean;
    category_tag?: string;
    adref?: string;
    created_date?: string;

    match_score?: number;
    match_reasons?: string[];
    recommended_actions?: string[];
    is_remote?: boolean;
  };
}

// Komponen wrapper untuk grid layout
export const JobCardGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Row gutter={[16, 16]}>
      {React.Children.map(children, (child, index) => (
        <Col
          xs={24} // 1 kolom di mobile (100%)
          sm={12} // 2 kolom di tablet (50%)
          md={8} // 3 kolom di desktop (33.33%)
          lg={8}
          xl={6} // 4 kolom di extra large screen (25%)
          key={index}
          style={{ padding: "8px" }}
        >
          {child}
        </Col>
      ))}
    </Row>
  );
};

const JobCardAll: React.FC<JobCardAllProps> = ({ job }) => {
  const screens = useBreakpoint();

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#52c41a";
    if (score >= 50) return "#faad14";
    return "#ff4d4f";
  };

  const ProgressCircle = ({ score }: { score: number }) => {
    const color = getScoreColor(score);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Progress
          type="circle"
          percent={score}
          strokeColor={color}
          size={screens.xs ? 60 : 70}
          format={(percent) => (
            <div
              style={{
                fontSize: screens.xs ? "14px" : "16px",
                fontWeight: "bold",
                color,
              }}
            >
              {percent}%
            </div>
          )}
        />
        <div style={{ marginTop: 4, fontSize: "11px", color: "#666" }}>
          Match
        </div>
      </div>
    );
  };

  const formatSalary = () => {
    if (job.salary_range) return job.salary_range;
    if (job.salary_min && job.salary_max) {
      return `£${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()}`;
    }
    if (job.salary_min) return `£${job.salary_min.toLocaleString()}+`;
    return "Salary not specified";
  };

  const getContractType = () => {
    if (job.contract_type === "permanent") return "Permanent";
    if (job.contract_type === "contract") return "Contract";
    if (job.contract_type === "temporary") return "Temporary";
    return job.contract_type || "N/A";
  };

  const getJobType = () => {
    if (job.contract_time === "full_time") return "Full Time";
    if (job.contract_time === "part_time") return "Part Time";
    return job.contract_time || "N/A";
  };

  return (
    <Card
      style={{
        height: "100%",
        borderLeft: `4px solid ${job.is_permanent ? "#1890ff" : job.contract_type === "contract" ? "#faad14" : "#722ed1"}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        margin: "20px"
      }}
      bodyStyle={{
        padding: screens.xs ? "12px" : "16px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        gap: "12px",
      }}
      hoverable
    >
      {/* Header Section - Compact */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        {/* Left Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            minWidth: 0, // Untuk text truncate
          }}
        >
          {/* Title with Truncate */}
          <Title
            level={screens.xs ? 5 : 4}
            style={{
              margin: 0,
              fontSize: screens.xs ? "14px" : "16px",
              lineHeight: 1.3,
            }}
            ellipsis={{ rows: 2 }}
          >
            <a
              href={job.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {job.title}
            </a>
          </Title>

          {/* Company and Location - Compact */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <UserOutlined style={{ color: "#666", fontSize: "12px" }} />
              <Text
                strong
                style={{
                  fontSize: screens.xs ? "12px" : "13px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {job.company}
              </Text>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <EnvironmentOutlined
                style={{ color: "#666", fontSize: "12px" }}
              />
              <Text
                style={{
                  fontSize: screens.xs ? "11px" : "12px",
                  color: "#666",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {job.location}
              </Text>
            </div>
          </div>

          {/* Tags - Compact */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              marginTop: "4px",
            }}
          >
            {job.is_permanent && (
              <Tag
                color="blue"
                style={{
                  fontSize: "10px",
                  padding: "0 6px",
                  lineHeight: "18px",
                  margin: 0,
                }}
              >
                Permanent
              </Tag>
            )}
            {job.is_full_time && (
              <Tag
                color="green"
                style={{
                  fontSize: "10px",
                  padding: "0 6px",
                  lineHeight: "18px",
                  margin: 0,
                }}
              >
                Full Time
              </Tag>
            )}
            {job.is_remote && (
              <Tag
                color="cyan"
                icon={<CheckCircleOutlined />}
                style={{
                  fontSize: "10px",
                  padding: "0 6px",
                  lineHeight: "18px",
                  margin: 0,
                }}
              >
                Remote
              </Tag>
            )}
          </div>
        </div>

        {/* Match Score - Compact */}
        {job.match_score !== undefined && (
          <div
            style={{
              flexShrink: 0,
            }}
          >
            <ProgressCircle score={Number(job.match_score)} />
          </div>
        )}
      </div>

      <Divider style={{ margin: "4px 0" }} />

      {/* Description - Compact */}
      <div style={{ flex: 1 }}>
        <Paragraph
          ellipsis={{
            rows: 3,
            expandable: true,
            symbol: "More",
          }}
          style={{
            margin: 0,
            fontSize: screens.xs ? "12px" : "13px",
            lineHeight: 1.5,
            color: "#444",
          }}
        >
          {job.description}
        </Paragraph>
      </div>

      {/* Match Reasons - Compact (hanya muncul jika ada) */}
      {job.match_reasons && job.match_reasons.length > 0 && (
        <div
          style={{
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: "6px",
            padding: "8px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircleOutlined
                style={{ color: "#52c41a", fontSize: "12px" }}
              />
              <Text strong style={{ fontSize: screens.xs ? "11px" : "12px" }}>
                Good Match
              </Text>
            </div>

            {job.match_reasons.slice(0, 2).map((reason, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    backgroundColor: "#52c41a",
                    borderRadius: "50%",
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: screens.xs ? "10px" : "11px",
                    lineHeight: 1.3,
                  }}
                >
                  {reason}
                </Text>
              </div>
            ))}
            {job.match_reasons.length > 2 && (
              <Text
                style={{
                  fontSize: "10px",
                  color: "#666",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                +{job.match_reasons.length - 2} more reasons
              </Text>
            )}
          </div>
        </div>
      )}

      {/* Job Details - Compact */}
      <div
        style={{
          paddingTop: "8px",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        {/* Salary and Contract Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <DollarCircleOutlined style={{ color: "#666", fontSize: "14px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Text strong style={{ fontSize: screens.xs ? "12px" : "13px" }}>
                {formatSalary()}
              </Text>
              {job.salary_is_predicted && (
                <Text type="secondary" style={{ fontSize: "9px" }}>
                  (Predicted)
                </Text>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <CalendarOutlined style={{ color: "#666", fontSize: "11px" }} />
              <Text type="secondary" style={{ fontSize: "10px" }}>
                {getContractType()}
              </Text>
            </div>

            {job.days_ago !== undefined && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <ClockCircleOutlined
                  style={{ color: "#666", fontSize: "11px" }}
                />
                <Text type="secondary" style={{ fontSize: "10px" }}>
                  {job.days_ago}d
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <Button
            type="primary"
            size={screens.xs ? "small" : "middle"}
            href={job.redirect_url}
            target="_blank"
            icon={<LinkOutlined />}
            style={{ flex: 1 }}
            block
          >
            {screens.xs ? "Apply" : "View Job"}
          </Button>

          <Button
            size={screens.xs ? "small" : "middle"}
            icon={<SaveOutlined />}
            style={{ flexShrink: 0 }}
          >
            {screens.xs ? "" : "Save"}
          </Button>
        </div>
      </div>

      {/* Recommended Actions - Compact (hanya muncul jika ada) */}
      {job.recommended_actions && job.recommended_actions.length > 0 && (
        <div
          style={{
            paddingTop: "12px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <BulbOutlined style={{ color: "#1890ff", fontSize: "12px" }} />
            <Text strong style={{ fontSize: screens.xs ? "11px" : "12px" }}>
              Tips
            </Text>
          </div>

          {job.recommended_actions.slice(0, 1).map((action, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#e6f7ff",
                border: "1px solid #91d5ff",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    backgroundColor: "#1890ff",
                    borderRadius: "50%",
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: screens.xs ? "10px" : "11px",
                    lineHeight: 1.3,
                  }}
                >
                  {action}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default JobCardAll;
