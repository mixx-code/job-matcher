// pages/api/alerts/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { AlertResponse } from '@/types/alert';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AlertResponse>
) {
  const { id } = req.query;
  
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
      return handleGetAlert(req, res, supabase, session.user.id, id as string);
    case 'PUT':
      return handleUpdateAlert(req, res, supabase, session.user.id, id as string);
    case 'DELETE':
      return handleDeleteAlert(req, res, supabase, session.user.id, id as string);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`
      });
  }
}

async function handleGetAlert(
  req: NextApiRequest,
  res: NextApiResponse<AlertResponse>,
  supabase: any,
  userId: string,
  alertId: string
) {
  try {
    const { data: alert, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error: any) {
    console.error('Error fetching alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handleUpdateAlert(
  req: NextApiRequest,
  res: NextApiResponse<AlertResponse>,
  supabase: any,
  userId: string,
  alertId: string
) {
  try {
    const updateData = req.body;
    
    // If updating frequency, recalculate next run
    if (updateData.frequency) {
      updateData.next_run = calculateNextRun(updateData.frequency);
    }

    const { data: alert, error } = await supabase
      .from('alerts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: alert,
      message: 'Alert updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handleDeleteAlert(
  req: NextApiRequest,
  res: NextApiResponse<AlertResponse>,
  supabase: any,
  userId: string,
  alertId: string
) {
  try {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}