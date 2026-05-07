"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Trophy, Award, Calendar, Loader2, Plus, X } from "lucide-react";

export default function MentorAchievements() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("FacultyAchievement").select("*").eq("faculty_id", user.id).order("created_at", { ascending: false });
      setAchievements(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("FacultyAchievement").insert({
      faculty_id: user.id,
      title: fd.get("title") as string,
      type: fd.get("type") as string,
      issuing_body: fd.get("issuing_body") as string,
      level: fd.get("level") as string,
      date: new Date(fd.get("date") as string).toISOString(),
    });
    setShowModal(false);
    window.location.reload();
  };

  if (loading) return <AppShell role="mentor"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">My Achievements</h1>
          <p className="text-text-muted text-sm mt-0.5">Publications, workshops and recognitions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Achievement</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.length > 0 ? achievements.map((a) => (
          <div key={a.id} className="card p-5 hover:border-accent/40 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="badge badge-accent">{a.type}</span>
            </div>
            <h3 className="font-heading font-bold text-text-primary">{a.title}</h3>
            <p className="text-text-muted text-sm mt-1">{a.issuing_body}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.date).toLocaleDateString()}</span>
              {a.level && <span className="flex items-center gap-1"><Award className="w-3 h-3" />{a.level}</span>}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center text-text-muted card"><Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No achievements yet. Add your first one!</p></div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Add Achievement</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="label">Title</label><input type="text" name="title" required className="input" placeholder="e.g. Published paper in IEEE" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Type</label>
                  <select name="type" className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                    <option>Publication</option><option>Workshop</option><option>Award</option><option>Patent</option><option>Other</option>
                  </select>
                </div>
                <div><label className="label">Level</label>
                  <select name="level" className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                    <option>Institution</option><option>National</option><option>International</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Issuing Body / Journal</label><input name="issuing_body" required className="input" placeholder="e.g. IEEE Transactions" /></div>
              <div><label className="label">Date</label><input type="date" name="date" required className="input" style={{ colorScheme: "dark" }} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
