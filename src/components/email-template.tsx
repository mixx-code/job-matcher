import * as React from 'react';

interface Job {
  company: string;
  job_title: string;
  job_url: string;
  location: string;
  match_reasons: string[];
  match_score: number;
  salary_range: string;
}

interface EmailTemplateProps {
  firstName: string;
  jobs?: Job[];
}

export function EmailTemplate({ firstName, jobs = [] }: EmailTemplateProps) {
  return (
    <div style={{ maxWidth: '600px', fontFamily: 'Arial, sans-serif' }}>
      <h1>👋 Hai {firstName}!</h1>
      <p>Berikut {jobs.length} pekerjaan yang cocok untukmu:</p>

      {jobs.map((job, index) => (
        <div key={index} style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>{job.job_title}</h3>
              <p style={{ margin: '4px 0', color: '#555' }}>🏢 {job.company}</p>
              <p style={{ margin: '4px 0', color: '#555' }}>📍 {job.location}</p>
              <p style={{ margin: '4px 0', color: '#555' }}>💰 {job.salary_range}</p>
            </div>
          </div>

          <div style={{ margin: '12px 0' }}>
            {job.match_reasons.map((reason, idx) => (
              <span key={idx} style={{
                background: '#e3f2fd',
                color: '#1976d2',
                padding: '4px 10px',
                margin: '4px 4px 4px 0',
                borderRadius: '12px',
                fontSize: '13px',
                display: 'inline-block'
              }}>
                {reason}
              </span>
            ))}
          </div>

          <a href={job.job_url} style={{
            display: 'inline-block',
            background: '#2196F3',
            color: 'white',
            padding: '8px 20px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            Lamar Sekarang
          </a>
        </div>
      ))}

      <p style={{ marginTop: '24px', color: '#666', fontSize: '14px' }}>
        💡 <strong>Tips:</strong> Update CV-mu untuk hasil yang lebih akurat!
      </p>
    </div>
  );
}

// import * as React from 'react';

// interface EmailTemplateProps {
//   firstName: string;
// }

// export function EmailTemplate({ firstName }: EmailTemplateProps) {
//   return (
//     <div>
//       <h1>Welcome, {firstName}!</h1>
//     </div>
//   );
// }