"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Bell, Calendar, Megaphone, AlertCircle, Loader2 } from "lucide-react";

const TYPE_ICON: Record<string, React.ElementType> = {
  Academic: Calendar,
  Event: Megaphone,
  Alert: AlertCircle,
  General: Bell,
  Hackathon: Megaphone,
};

export default function StudentFeed() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("FeedPost")
        .select("*")
        .order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) return <AppShell role="student"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="student">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Campus Feed</h1>
        <p className="text-text-muted text-sm mt-0.5">Latest announcements and events</p>
      </div>

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => {
            const Icon = TYPE_ICON[post.type] || Bell;
            return (
              <div key={post.id} className="card p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent mt-0.5 flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-accent text-xs">{post.type}</span>
                    <span className="text-xs text-text-muted">{new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <h3 className="font-heading font-bold text-text-primary">{post.title}</h3>
                  <p className="text-text-muted text-sm mt-1">{post.content}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card py-16 text-center text-text-muted">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No announcements yet.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
