// pages/api/cron/alerts.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { cronManager } from '../../../lib/cron-manager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    try {
      const status = cronManager.getStatus();
      
      res.status(200).json({
        success: true,
        data: {
          cronJob: {
            running: status.running,
            lastExecution: status.lastExecution?.toISOString(),
            totalRuns: status.totalRuns,
            nextExecution: cronManager.getNextExecution()?.toISOString(),
            lastError: status.lastError
          },
          serverTime: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
          serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing'
        },
      });
      
    } catch (error: any) {
      console.error('Error getting cron status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
    
  } else if (req.method === 'POST') {
    try {
      const { action } = req.body;
      
      if (!action) {
        return res.status(400).json({
          success: false,
          error: 'Missing "action" field in request body'
        });
      }
      
      let result;
      
      switch (action) {
        case 'start':
          result = await cronManager.start();
          break;
          
        case 'stop':
          result = cronManager.stop();
          break;
          
        case 'execute':
          result = await cronManager.executeNow();
          break;
          
        case 'status':
          const status = cronManager.getStatus();
          result = {
            success: true,
            data: status
          };
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action. Use "start", "stop", "execute", or "status"'
          });
      }
      
      res.status(200).json(result);
      
    } catch (error: any) {
      console.error('Error handling cron action:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process request',
        message: error.message
      });
    }
    
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }
}