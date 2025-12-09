// pages/api/alerts/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { AlertResponse } from '@/types/alert';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AlertResponse>
) {
  
  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGetAlerts(req, res, supabase, session.user.id);
    case 'POST':
      return handleCreateAlert(req, res, supabase, session.user.id);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`
      });
  }
}

async function handleGetAlerts(
  req: NextApiRequest,
  res: NextApiResponse<AlertResponse>,
  supabase: any,
  userId: string
) {
  try {
    const { filter = 'all' } = req.query;
    
    let query = supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId);

    if (filter === 'active') {
      query = query.eq('is_active', true);
    } else if (filter === 'inactive') {
      query = query.eq('is_active', false);
    }

    query = query.order('created_at', { ascending: false });

    const { data: alerts, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handleCreateAlert(
  req: NextApiRequest,
  res: NextApiResponse<AlertResponse>,
  supabase: any,
  userId: string
) {
  try {
    const alertData = req.body;
    
    // Validate required fields
    if (!alertData.name || !alertData.notificationTarget) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Calculate next run time
    const nextRun = calculateNextRun(alertData.frequency);

    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        name: alertData.name,
        search_criteria: alertData.searchCriteria,
        frequency: alertData.frequency,
        notification_method: alertData.notificationMethod,
        notification_target: alertData.notificationTarget,
        is_active: alertData.isActive !== undefined ? alertData.isActive : true,
        next_run: nextRun
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully'
    });
  } catch (error: any) {
    console.error('Error creating alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function calculateNextRun(frequency: 'daily' | 'weekly'): Date {
  const now = new Date();
  const nextRun = new Date(now);
  
  if (frequency === 'daily') {
    nextRun.setDate(nextRun.getDate() + 1);
  } else {
    nextRun.setDate(nextRun.getDate() + 7);
  }
  
  // Set to 8 AM
  nextRun.setHours(8, 0, 0, 0);
  
  return nextRun;
}