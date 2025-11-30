import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Get session from request
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
        try {
            // Get user profile from database
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) {
                return res.status(400).json({ error: error.message })
            }

            return res.status(200).json({ profile: data })
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error', message: error })
        }
    }

    if (req.method === 'PUT') {
        try {
            const { username, full_name } = req.body

            const { data, error } = await supabase
                .from('profiles')
                .update({ username, full_name, updated_at: new Date() })
                .eq('id', user.id)
                .select()

            if (error) {
                return res.status(400).json({ error: error.message })
            }

            return res.status(200).json({ profile: data })
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error', message: error })
        }
    }

    return res.status(405).json({ message: 'Method not allowed' })
}