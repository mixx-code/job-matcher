/* eslint-disable import/no-anonymous-default-export */
import { EmailTemplate } from '@/components/email-template';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


export default async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Parse body
        let body;
        try {
            body = JSON.parse(req.body);
        } catch {
            body = req.body; // Jika sudah terparse otomatis oleh Next.js
        }

        const { firstName, email, alert, jobs } = body;

        console.log('Received alert:', alert);
        console.log('Type of alert:', typeof alert);

        // Debug: log seluruh body
        // console.log('Full body received:', body);

        // Validasi data
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Jika alert masih string, parse ke JSON
        let parsedAlert = alert;
        if (typeof alert === 'string') {
            try {
                parsedAlert = JSON.parse(alert);
            } catch (parseError) {
                console.error('Error parsing alert string:', parseError);
                parsedAlert = { raw: alert };
            }
        }

        // console.log('Parsed alert:', parsedAlert);
        let parsedJobs = jobs;
        if (typeof jobs === 'string') {
            try {
                parsedJobs = JSON.parse(jobs);
            } catch (parseError) {
                console.error('Error parsing jobs string:', parseError);
                parsedJobs = { raw: jobs };
            }
        }

        console.log('Parsed jobs:', parsedJobs);

        const { data, error } = await resend.emails.send({
            from: 'AyoCariKerja <onboarding@resend.dev>',
            to: [email],
            subject: 'Hello world',
            react: EmailTemplate({ firstName, jobs: parsedJobs.matched_jobs }),
        });

        if (error) {
            return res.status(400).json(error);
        }

        res.status(200).json(data);

        // Untuk testing, kembalikan data yang diterima
        // res.status(200).json({
        //     success: true,
        //     message: 'Data received successfully',
        //     data: {
        //         firstName,
        //         email,
        //         alert: parsedAlert,
        //         jobs: parsedJobs.matched_jobs
        //     }
        // });

    } catch (error) {
        console.error('Error in /api/send:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error
        });
    }
};



// export default async (req: NextApiRequest, res: NextApiResponse) => {
//     try {
//         // Only allow POST requests
//         if (req.method !== 'POST') {
//             return res.status(405).json({ error: 'Method not allowed' });
//         }

//         const { firstName, email, alert } = req.body;

//         if (!email) {
//             return res.status(400).json({ error: 'Email is required' });
//         }

//         const { data, error } = await resend.emails.send({
//             from: 'Acme <onboarding@resend.dev>',
//             to: [email],
//             subject: 'Hello world',
//             react: EmailTemplate({ firstName: firstName || 'User' }),
//         });

//         if (error) {
//             return res.status(400).json(error);
//         }

//         res.status(200).json(data);
//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };