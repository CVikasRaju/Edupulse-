"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Save, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("Profile").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("Profile").update({
      phone: fd.get("phone"),
      address: fd.get("address"),
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <AppShell role="admin"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Admin Settings</h1>
        <p className="text-text-muted text-sm mt-0.5">Manage your administrator profile</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent text-3xl font-bold">
            {profile?.full_name?.[0] ?? "?"}
          </div>
          <div>
            <h2 className="font-heading font-bold text-text-primary text-lg">{profile?.full_name}</h2>
            <p className="text-text-muted text-sm">{profile?.email}</p>
          </div>
          <span className="badge badge-danger">Administrator</span>
          <p className="font-mono text-sm text-text-muted">{profile?.employee_id}</p>
        </div>
        <div className="lg:col-span-2 card p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input className="input" defaultValue={profile?.full_name ?? ""} disabled /></div>
              <div><label className="label">Email</label><input className="input" defaultValue={profile?.email ?? ""} disabled /></div>
              <div><label className="label">Phone</label><input type="tel" name="phone" className="input" defaultValue={profile?.phone ?? ""} placeholder="+91 00000 00000" /></div>
              <div><label className="label">Address</label><input name="address" className="input" defaultValue={profile?.address ?? ""} placeholder="Your address" /></div>
            </div>
            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : saved ? "✓ Saved!" : <><Save className="w-4 h-4" />Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
