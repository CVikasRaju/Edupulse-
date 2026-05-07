"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Bell, Plus, X, Loader2, Trash2 } from "lucide-react";

export default function AdminFeed() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("FeedPost")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    
    const { error } = await supabase.from("FeedPost").insert({
      title: fd.get("title") as string,
      content: fd.get("content") as string,
      type: fd.get("type") as string,
      updated_at: new Date().toISOString()
    });

    if (!error) {
      setShowModal(false);
      fetchPosts();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("FeedPost").delete().eq("id", id);
    if (!error) fetchPosts();
  };

  if (loading) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="admin">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Campus Feed</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage announcements for the campus</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm"><Plus className="w-4 h-4" />New Post</button>
      </div>

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="card p-5 flex items-start justify-between gap-4 group">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-accent">{post.type}</span>
                </div>
                <h3 className="font-heading font-bold text-text-primary">{post.title}</h3>
                <p className="text-text-muted text-sm mt-1">{post.content}</p>
                <div className="text-xs text-text-muted mt-2">{new Date(post.created_at).toLocaleDateString()}</div>
              </div>
              <button onClick={() => handleDelete(post.id)} className="text-text-muted hover:text-danger p-2 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-text-muted card">No announcements yet.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">New Announcement</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="label">Title</label>
                <input type="text" name="title" required className="input" placeholder="Title..." />
              </div>
              <div>
                <label className="label">Category</label>
                <select name="type" className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Event">Event</option>
                  <option value="Alert">Alert</option>
                </select>
              </div>
              <div>
                <label className="label">Content</label>
                <textarea name="content" required rows={4} className="input py-2" placeholder="Write message..."></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Posting..." : "Post Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
