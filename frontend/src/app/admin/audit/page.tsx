"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { FileText, Loader2 } from "lucide-react";

export default function AdminAudit() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("AuditLogEntry")
        .select(`*, Profile!AuditLogEntry_user_id_fkey(full_name, role)`)
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <AppShell role="admin"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Audit Log</h1>
        <p className="text-text-muted text-sm mt-0.5">System activity trail</p>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th></tr></thead>
          <tbody>
            {logs.length > 0 ? logs.map((log) => (
              <tr key={log.id}>
                <td className="text-xs text-text-muted whitespace-nowrap">{new Date(log.created_at).toLocaleString("en-IN")}</td>
                <td className="font-medium">{log.Profile?.full_name ?? "System"}</td>
                <td><span className="badge badge-accent">{log.action}</span></td>
                <td className="text-text-muted text-sm">{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="py-16 text-center text-text-muted">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No audit logs yet. Activity will appear here as users interact with the system.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
