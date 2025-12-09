// pages/api/cron/start.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { cronManager } from '../../../lib/cron-manager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const result = await cronManager.start();
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start cron job',
      details: error.message,
    });
  }
}