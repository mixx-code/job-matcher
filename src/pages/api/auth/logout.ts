import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const { error } = await supabase.auth.signOut()

        if (error) {
            return res.status(400).json({ error: error.message })
        }

        return res.status(200).json({ message: 'Logout successful' })
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', message: error })
    }
}