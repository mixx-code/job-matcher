import { supabase } from "./supabaseClient";

const checkDataCv = async (userId: string | undefined) => {

    try {
        const { data, error } = await supabase
            .from('user_cvs')
            .select('*')
            .eq("user_id", userId)
            .maybeSingle(); // Gunakan maybeSingle, bukan single

        if (error) {
            console.error('Error fetching CV:', error.message);
            return { data: null, error, exists: false };
        }

        return {
            data,
            error: null,
            exists: !!data
        };

    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            data: null,
            error: error as Error,
            exists: false
        };
    }
};