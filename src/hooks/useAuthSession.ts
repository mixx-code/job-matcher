import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

export const useAuthSession = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setSession(session);

            if (session?.user) {
                try {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", session.user.id)
                        .single();
                    setUser({ ...session.user, ...profile });
                } catch (error) {
                    console.log("Profiles table not found or error, using user data only");
                    setUser(session.user);
                }
            }
            setLoading(false);
        };

        getSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) router.push("/login");
        });

        return () => subscription.unsubscribe();
    }, [router]);

    return { session, user, loading };
};