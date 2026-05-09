"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Search, Filter, MessageSquare, ChevronRight, User, Loader2 } from "lucide-react";
import Link from "next/link";

export default function MentorMentees() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<any[]>([]);

  useEffect(() => {
    const fetchMentees = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get allocations for this mentor
      const { data: allocations } = await supabase
        .from("Allocation")
        .select(`
          id,
          Profile!Allocation_mentee_id_fkey (
            id,
            full_name,
            email,
            usn,
            department,
            year
          )
        `)
        .eq("mentor_id", user.id)
        .eq("is_active", true);

      const menteesList = allocations?.map((a: any) => a.Profile) || [];
      setMentees(menteesList);
      setLoading(false);
    };
    fetchMentees();
  }, []);

  if (loading) {
    return (
      <AppShell role="mentor">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary tracking-tight">Your Mentees</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage and track your assigned students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mentees.length > 0 ? (
          mentees.map((m) => (
            <div key={m.id} className="card p-5 group hover:border-accent/40 transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                  {m.full_name[0]}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-text-primary group-hover:text-accent transition-colors">{m.full_name}</h3>
                  <p className="text-text-muted text-xs font-mono">{m.usn}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Department</span>
                  <span className="text-text-primary font-medium">{m.department}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Current Year</span>
                  <span className="text-text-primary font-medium">{m.year}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost btn-sm flex-1 text-xs">View Profile</button>
                <button className="btn-primary btn-sm flex-1 text-xs">Add Interaction</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-text-muted">
            You don&apos;t have any mentees assigned yet.
          </div>
        )}
      </div>
    </AppShell>
  );
}
