"use client";

// src/hooks/useUser.ts
// Client-side hook that provides the current authenticated user's Profile data.
// Uses Supabase browser client — safe to call from any "use client" component.

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/lib/types";

interface UseUserResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useUser(): UseUserResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("Profile")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError || !profileData) {
          setError("Profile not found");
          setLoading(false);
          return;
        }

        setProfile(profileData as Profile);
      } catch (err) {
        setError("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Listen for auth state changes (e.g. logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { profile, loading, error };
}
