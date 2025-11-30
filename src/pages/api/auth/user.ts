import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            return res.status(400).json({ error: error.message })
        }

        return res.status(200).json({ user })
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', message: error })
    }
}